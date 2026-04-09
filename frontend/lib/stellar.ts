import {
  rpc,
  TransactionBuilder,
  Networks,
  Address,
  scValToNative,
  xdr,
  nativeToScVal,
  Account,
} from "@stellar/stellar-sdk";

const SOROBAN_RPC_URL = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE = Networks.TESTNET;

export const server = new rpc.Server(SOROBAN_RPC_URL);

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
    
    // Convert JS args to ScVals
    const scArgs = args.map(arg => nativeToScVal(arg));

    const tx = new TransactionBuilder(account, {
      fee: "10000",
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        rpc.Operation.invokeContractFunction({
          contractId,
          function: method,
          args: scArgs,
        })
      )
      .setTimeout(30)
      .build();

    // Prepare for simulation
    const simulated = await server.simulateTransaction(tx);
    
    if (rpc.Api.isSimulationError(simulated)) {
      throw new Error(`Simulation failed: ${simulated.error}`);
    }

    // Assemble transaction with simulation results
    const assembledTx = rpc.assembleTransaction(tx, simulated);

    // Sign with wallet
    const xdrEncoded = assembledTx.toXDR();
    const signedXdr = await signTransaction(xdrEncoded);
    
    // Submit
    const response = await server.sendTransaction(TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE));
    
    if (response.status === "PENDING") {
      // Poll for result
      let result = await server.getTransaction(response.hash);
      while (result.status === "NOT_FOUND" || result.status === "PROCESSING") {
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
    
    return { hash: response.hash, success: response.status === "SUCCESS" };
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
    const scArgs = args.map(arg => nativeToScVal(arg));
    
    // Create a dummy transaction for simulation
    const tx = new TransactionBuilder(
      new Account("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+++++++++++++++++++", "0"),
      {
        fee: "100",
        networkPassphrase: NETWORK_PASSPHRASE,
      }
    )
      .addOperation(
        rpc.Operation.invokeContractFunction({
          contractId,
          function: method,
          args: scArgs,
        })
      )
      .build();

    const simulation = await server.simulateTransaction(tx);
    
    if (rpc.Api.isSimulationSuccess(simulation) && simulation.result) {
      return scValToNative(simulation.result.retval);
    }
    return null;
  } catch (error) {
    console.error("Contract query error:", error);
    return null;
  }
}
