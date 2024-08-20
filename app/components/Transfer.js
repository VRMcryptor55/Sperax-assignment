"use client"
import { useEffect, useState } from "react";
import styles from "./transfer.module.css";
import { parseUnits } from "ethers";
import { formatWeiAmount } from "../utils";
import Link from "next/link";

export default function Transfer({provider,wallet,chain,nativeAsset,transfer,setShowTransferModal}){
    
    const [txCostEth, setTxCostEth] = useState(undefined); //in wei
    const [txCostUSD, setTxCostUSD] = useState(undefined);
    const [sending, setSending] = useState(undefined);
    const [txHash, setTxHash] = useState(undefined);
    const [error, setError] = useState(undefined);
    
    useEffect(() => {
        const init = async() =>{
            const txRequest={
                from: wallet.address,
                to: transfer.to,
                value: parseUnits(transfer.amount,transfer.asset.decimals)
            };
            const gasCost= await wallet.estimateGas(txRequest);
            const feeData= await provider.getFeeData();
            const txCostEth= BigInt(gasCost)*BigInt(feeData.maxFeePerGas);
            const ethPriceRaw = Number(2400)
            const ethPrice=BigInt(ethPriceRaw)
            const txCostUSD=txCostEth* ethPrice;
            setTxCostEth(txCostEth);
            setTxCostUSD(txCostUSD);
        };
        init();
    }, []);
    
    const getTransactionFeeString = () =>{
        return `${formatWeiAmount(txCostUSD,nativeAsset.decimals)} USD (${formatWeiAmount(txCostEth,nativeAsset.decimals)} ${nativeAsset.ticker})`;
    };

    const getTransactionUrl = hash =>{
        return `${chain.blockchainExplorer}/${hash}`;
    };

    const send= async ()=>{
        setSending(true);
        try {
            const txRequest={
                from: wallet.address,
                to: transfer.to,
                value: parseUnits(transfer.amount,transfer.asset.decimals)
            };
            const txResponse= await wallet.sendTransaction(txRequest);
            const txReceipt= await txResponse.wait();
            if(parseInt(txReceipt.status!==1))throw new Error("Transaction Failed");
            setTxHash(txReceipt.hash);
        }catch(error){
            setError(true);
        }finally{
            setSending(false);
        }
    }


    return (
        <div id={styles.overlay}>
            <div id={styles.transfer}>
                <h2 className="fw-bold text-xenter">Transfer Details</h2>
                <div className="form-group mb-3">
                    <label>Network</label>
                    <input type="text" 
                        className="form-control mb-3"
                        name="network"
                        value={chain.name}
                        disabled={true}
                    />
                </div>
                <div className="form-group mb-3">
                    <label>from</label>
                    <input type="text" 
                        className="form-control mb-3"
                        name="from"
                        value={wallet.address}
                        disabled={true}
                    />
                </div>
                <div className="form-group mb-3">
                    <label>To</label>
                    <input type="text" 
                        className="form-control mb-3"
                        name="to"
                        value={transfer.to}
                        disabled={true}
                    />
                </div>
                <div className="form-group mb-3">
                    <label>Amount</label>
                    <input type="text" 
                        className="form-control mb-3"
                        name="amount"
                        value={transfer.amount}
                        disabled={true}
                    />
                </div>
                <div className="form-group mb-3">
                    <label>Transaction fee</label>
                    <input type="text" 
                        className="form-control mb-3"
                        name="txFee"
                        value={txCostEth && txCostUSD ? getTransactionFeeString(): "Loading..."}
                        disabled={true}
                    />
                </div>
                {sending && <div className="alert alert-info mt-3 mb-3"><i className="bi bi-info-circle-fill"></i>Sending...</div>} 
                {txHash && <div className="alert alert-info mt-3 mb-3"><i className="bi bi-check-circle-fill"></i>Transfer successful! - <Link href={getTransactionUrl(txHash)}>Transaction hash</Link></div>}
                {error && <div className="alert alert-danger mt-3 mb-3"><i className="bi bi-exclamation-triangle-fill"></i>Oops, the transfer failed...</div>}
                <div className="text-right">
                     <button className="btn btn-primary me-3" onClick={send}>Submit</button>
                    <button className="btn btn-secondary" onClick={()=> setShowTransferModal(false)}>Close</button>
                </div>
            </div>
        </div>
    );
}