#!/bin/bash
NETWORK="testnet"
ADMIN="deployer"

# IDs
VR="CBTN5W3TVAXIDW7I5WNUQW2VDNTGPQM7H5ARDLCX7V7SP3LFQ6GN66TO"
SR="CDOEID4K352SX6HQRHIJWFIERJ73DWNCVUQEZCFYI6UWGTF7ZLHYNMSD"
CC="CBONH4U4ULXA65DQWTI3DQSF7R3TITTNM35JPA2LINRBGXSCVFECKLSN"
RP="CBETKYEKVQA2LNBL2D7KPMOQALELA4BW2SNO5BJ326CZHQNHQIUUBWYL"
USDC="CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA"

ADMIN_ADDR=$(stellar keys address $ADMIN)

echo "Initializing Victim Registry..."
stellar contract invoke --id $VR --source $ADMIN --network $NETWORK -- initialize --admin $ADMIN_ADDR

echo "Initializing Shopkeeper Registry..."
stellar contract invoke --id $SR --source $ADMIN --network $NETWORK -- initialize --admin $ADMIN_ADDR

echo "Initializing Clawback Controller..."
stellar contract invoke --id $CC --source $ADMIN --network $NETWORK -- initialize --admin $ADMIN_ADDR --token_address $USDC

echo "Initializing Relief Pool..."
stellar contract invoke --id $RP --source $ADMIN --network $NETWORK -- initialize --admin $ADMIN_ADDR --token_address $USDC --victim_registry $VR --shopkeeper_registry $SR --clawback_controller $CC

echo "All contracts initialized."
