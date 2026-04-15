import {
  rpc,
  TransactionBuilder,
  Networks,
  Address,
  scValToNative,
  xdr,
  nativeToScVal,
  Account,
  Keypair,
  Operation,
  Transaction,
  Horizon,
} from "@stellar/stellar-sdk";

const SOROBAN_RPC_URL = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE = Networks.TESTNET;

export const server = new rpc.Server(SOROBAN_RPC_URL);
export const horizonServer = new Horizon.Server(process.env.NEXT_PUBLIC_HORIZON_URL || "https://horizon-testnet.stellar.org");

/**
 * Invokes a Soroban contract method.
 */
export async function invokeContract({
  contractId,
  method,
  args = [],
  publicKey,
  signTransaction,
}: {
  contractId: string;
  method: string;
  args?: any[];
  publicKey: string;
  signTransaction: (tx: string) => Promise<string>;
}) {
  try {
    const account = await server.getAccount(publicKey);
    
    // Convert JS args to ScVals unless they are already raw ScVals
    const scArgs = args.map(arg => {
      if (arg && typeof arg.switch === 'function') {
        return arg;
      }
      if (arg && arg.type && arg.value !== undefined) {
        return nativeToScVal(arg.value, { type: arg.type });
      }
      return nativeToScVal(arg);
    });

    const tx = new TransactionBuilder(account, {
      fee: "10000",
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.invokeContractFunction({
          contract: contractId,
          function: method,
          args: scArgs,
        })
      )
      .setTimeout(30)
      .build();

    // Prepare and assemble transaction cleanly in v15
    const preparedTx = await server.prepareTransaction(tx);
    
    // Sign with wallet
    const xdrEncoded = preparedTx.toXDR();
    const signedXdr = await signTransaction(xdrEncoded);
    
    // Submit
    const response = await server.sendTransaction(TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE));
    
    if (response.status === "PENDING") {
      // Poll for result
      let result = await server.getTransaction(response.hash);
      while (result.status === "NOT_FOUND") {
        await new Promise(resolve => setTimeout(resolve, 1000));
        result = await server.getTransaction(response.hash);
      }
      
      if (result.status === "SUCCESS") {
        const meta = result.resultMetaXdr;
        // In a real app, you'd parse the result from meta
        return { hash: response.hash, success: true };
      } else {
        throw new Error(`Transaction failed: ${result.status}`);
      }
    }
    
    return { hash: response.hash, success: false };
  } catch (error) {
    console.error("Contract invocation error:", error);
    throw error;
  }
}

/**
 * Fetches data from a Soroban contract (read-only).
 */
export async function queryContract({
  contractId,
  method,
  args = [],
}: {
  contractId: string;
  method: string;
  args?: any[];
}) {
  try {
    const scArgs = args.map(arg => {
      if (arg && typeof arg.switch === 'function') {
        return arg;
      }
      if (arg && arg.type && arg.value !== undefined) {
        return nativeToScVal(arg.value, { type: arg.type });
      }
      return nativeToScVal(arg);
    });
    const dummyKey = Keypair.random().publicKey();

    const tx = new TransactionBuilder(
      new Account(dummyKey, "0"),
      {
        fee: "100",
        networkPassphrase: NETWORK_PASSPHRASE,
      }
    )
      .addOperation(
        Operation.invokeContractFunction({
          contract: contractId,
          function: method,
          args: scArgs,
        })
      )
      .setTimeout(30)
      .build();

    const simulation = await server.simulateTransaction(tx);
    
    if (rpc.Api.isSimulationSuccess(simulation) && simulation.result) {
      return scValToNative(simulation.result.retval);
    }
    return null;
  } catch (e) {
    console.error(`Query failed for ${method}:`, e);
    return null;
  }
}

/**
 * Invokes a Soroban contract method using a secret key for signing.
 */
export async function invokeContractWithSecret({
  contractId,
  method,
  args = [],
  secretKey,
}: {
  contractId: string;
  method: string;
  args?: any[];
  secretKey: string;
}) {
  try {
    const sourceKeypair = Keypair.fromSecret(secretKey);
    const publicKey = sourceKeypair.publicKey();
    const account = await server.getAccount(publicKey);
    
    const scArgs = args.map(arg => {
      if (arg && typeof arg.switch === 'function') return arg;
      if (arg && arg.type && arg.value !== undefined) return nativeToScVal(arg.value, { type: arg.type });
      return nativeToScVal(arg);
    });

    const tx = new TransactionBuilder(account, {
      fee: "10000",
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(Operation.invokeContractFunction({ contract: contractId, function: method, args: scArgs }))
      .setTimeout(30)
      .build();

    const preparedTx = await server.prepareTransaction(tx);
    preparedTx.sign(sourceKeypair);
    
    const response = await server.sendTransaction(preparedTx);
    
    if (response.status === "PENDING") {
      let result = await server.getTransaction(response.hash);
      while (result.status === "NOT_FOUND") {
        await new Promise(resolve => setTimeout(resolve, 1000));
        result = await server.getTransaction(response.hash);
      }
      return { hash: response.hash, success: result.status === "SUCCESS" };
    }
    
    return { hash: response.hash, success: false };
  } catch (error) {
    console.error("Secret contract invocation error:", error);
    throw error;
  }
}

/**
 * Transfers administrative ownership of a contract.
 */
export async function transferAdmin({
  contractId,
  currentAdminSecret,
  newAdminAddress,
}: {
  contractId: string;
  currentAdminSecret: string;
  newAdminAddress: string;
}) {
  return await invokeContractWithSecret({
    contractId,
    method: "transfer_admin",
    args: [{ type: 'address', value: Keypair.fromSecret(currentAdminSecret).publicKey() }, { type: 'address', value: newAdminAddress }],
    secretKey: currentAdminSecret,
  });
}

/**
 * Streams transactions for an account using SSE.
 */
export function streamTransactions(
  publicKey: string,
  onTransaction: (tx: any) => void
): () => void {
  const accountUrl = `${process.env.NEXT_PUBLIC_HORIZON_URL || "https://horizon-testnet.stellar.org"}/accounts/${publicKey}/transactions?cursor=now&order=asc`;

  let source: EventSource | null = null;

  try {
    source = new EventSource(accountUrl);

    source.onmessage = (event) => {
      try {
        const tx = JSON.parse(event.data);
        if (tx.hash) {
          onTransaction({
            hash: tx.hash.slice(0, 8) + "...",
            fullHash: tx.hash,
            createdAt: tx.created_at,
            memo: tx.memo || "Contract call",
            successful: tx.successful,
            explorerUrl: `https://stellar.expert/explorer/testnet/tx/${tx.hash}`,
            type: classifyTransaction(tx),
          });
        }
      } catch (err) {
        console.error("SSE parse error:", err);
      }
    };

    source.onerror = (err) => {
      // Quietly close on EventSource drops (usually 404 before account is fully synced)
      source?.close();
    };
  } catch (err) {
    console.error("EventSource error:", err);
  }

  return () => {
    source?.close();
  };
}

function classifyTransaction(tx: any): string {
  const memo = tx.memo || "";
  const memoUpper = memo.toUpperCase();
  if (memoUpper.includes("DISTRIBUTE")) return "aid_distributed";
  if (memoUpper.includes("FUND")) return "pool_funded";
  if (memoUpper.includes("CLAWBACK")) return "clawback";
  if (memoUpper.includes("REGISTER")) return "victim_registered";
  return "transaction";
}
