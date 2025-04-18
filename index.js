import { Web3 } from "web3";
import chalk from "chalk";
import fs from "fs";
import { swapcUSDETH } from "./modules/gte_module.js"
import { runTekoAll } from "./modules/teko_module.js";

const AMOUNT_CUSD_TO_WETH = "10000" // nanti cv ke wei / decimal 18
const AMOUNT_TKUSDC_TO_WETH = "10000" // nanti cv ke mwei / decimal 6
// AMOUNT DEPO TKETH 10 (FIXED) & WD TKETH 1 (FIXED)
const AMOUNT_TKWBTC_TO_WETH = "0.1" // nanti cv ke gwei decimal 9

const mintcUSD = async (web3, account, saldo) => {
    while(true) {
        try {
            // estimasi gas dari address dengan sc dengan data dan value
            const estGas = await web3.eth.estimateGas({
                form: account.address,
                to: "0xE9b6e75C243B6100ffcb1c66e8f78F96FeeA727F",
                data: `0x40c10f19000000000000000000000000${account.address.split('0x')[1]}00000000000000000000000000000000000000000000003635c9adc5dea00000`
            })
    
            // get gas price
            const gasPrice = await web3.eth.getGasPrice()
            const estTxFee = web3.utils.fromWei(estGas, 'Gwei') * web3.utils.fromWei(gasPrice, "Gwei")
    
            if (Number(estTxFee) <= Number(saldo) && Number(saldo) >= 0) {
                console.log("   Saldo ETH mencukupi, transaksi diproses...")
                console.log(`🔥 Sedang melakukan mint ${chalk.yellow(`1000 testnet cUSD`)}`)
    
                // get fee data terkini
                const feeData = await web3.eth.calculateFeeData();
    
                // raw tx
                const transaction = {
                    from: account.address,
                    to: "0xE9b6e75C243B6100ffcb1c66e8f78F96FeeA727F",
                    data: `0x40c10f19000000000000000000000000${account.address.split('0x')[1]}00000000000000000000000000000000000000000000003635c9adc5dea00000`,
                    gasprice: estGas*4n,
                    maxFeePerGas: feeData.gasPrice,
                    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
                    nonce: await web3.eth.getTransactionCount(account.address),
                };
    
                // sign tx
                const signedTransaction = await web3.eth.accounts.signTransaction(
                    transaction,
                    account.pkey,
                );
    
                // send sign tx
                try {
                    const receipt = await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);
                    console.log(`   Transaction hash: ${chalk.green(`https://www.megaexplorer.xyz/tx/${receipt.transactionHash}`)}`);
                    console.log(`   Transaction fee: ${chalk.yellow(`${web3.utils.fromWei(receipt.effectiveGasPrice * receipt.gasUsed, 'ether')} Mega ETH`)}`)
                    const txStat = await web3.eth.getTransactionReceipt(receipt.transactionHash)
                    
                    if (web3.utils.toNumber(txStat.status) == 1) {
                        return 1
                    } else {
                        continue
                    }
                } catch (err) {
                    console.log(chalk.red(`⛔ ${err.message}`))
                }
            } else {
                return
            }
        } catch (err) {
            console.log(chalk.red(`⛔ ${err.message}`))
        }
    }
}

(async () => {
    while(true) {
        try {
            // connect rpc
            const web3 = new Web3("https://carrot.megaeth.com/rpc");
            // console.log(web3)

            try {
                // buka pkey.txt
                const data = fs.readFileSync('pkey.txt', 'utf-8')
                const pkeys = data.split('\n')
    
                // setup
                let accounts = []
    
                for (const pkey of pkeys) {
                    if (pkey != '') {
                        // setupwallet part1
                        const user = web3.eth.accounts.privateKeyToAccount(pkey);
    
                        accounts.push({
                            "pkey": pkey,
                            "address": user.address,
                        })
                    }
                }
    
                let txSuksesJumlah = 0
                const start = new Date().toLocaleTimeString()
                while (true) {
                    console.log("💥 MegaETH Testnet Auto TX (Mint Token, GTE Swap, Teko)")
     
                    console.log(`\n🚨 ${chalk.red(`GUNAKAN WALLET TESTNET, MARKET ORDER (TIDAK ADA KEPUTUSAN LAIN), HANYA TESTNET BUKAN ASET RIL!`)}`)
                    console.log(`🚨 ${chalk.yellow(`Mint token 1000 cUSD, 2000 tkUSDC, 1 tkETH, dan 0.02 tkWBTC`)}`)
                    console.log(`🚨 ${chalk.yellow(`Swap cUSD ke WETH setiap ${AMOUNT_CUSD_TO_WETH} cUSD`)}`)
                    console.log(`🚨 ${chalk.yellow(`Swap tkUSDC ke WETH setiap ${AMOUNT_TKUSDC_TO_WETH} tkUSDC`)}`)
                    console.log(`🚨 ${chalk.yellow(`Deposit setiap 10 tkETH & Withdraw setiap 1 tkETH`)}`)
                    console.log(`🚨 ${chalk.yellow(`Swap tkWBTC ke WETH setiap ${AMOUNT_TKWBTC_TO_WETH} tkWBTC`)}`)
    
                    for (const account of accounts) {
                        //setupwallet part2
                        const balanceAcc = await web3.eth.getBalance(account.address)
                        let saldo = web3.utils.fromWei(balanceAcc, 'ether')
                        // console.log(saldo)
    
                        console.log(`\n🔑 EVM address: ${chalk.green(account.address)}\n🏦 Saldo: ${chalk.yellow(`${saldo} Mega ETH`)}`)
    
                        // mint cusd
                        const status_mint = await mintcUSD(web3, account, saldo)
                        if(status_mint == 1) {
                            txSuksesJumlah += 1
                        }
                        await new Promise(resolve => setTimeout(resolve, 200)) // delay 0.2 detik
    
                        //gte swap cusd weth
                       const stat_swap_cusd_weht = await swapcUSDETH(web3, account, AMOUNT_CUSD_TO_WETH)
                        if(stat_swap_cusd_weht != undefined) {
                            txSuksesJumlah = txSuksesJumlah+stat_swap_cusd_weht
                        }
                        await new Promise(resolve => setTimeout(resolve, 200)) // delay 0.2 detik
    
                        // teko
                        const status_mint_teko = await runTekoAll(web3, account, AMOUNT_TKUSDC_TO_WETH, AMOUNT_TKWBTC_TO_WETH)
                        if(status_mint_teko != undefined) {
                            txSuksesJumlah = txSuksesJumlah+status_mint_teko
                        }
                    }
    
                    console.log(`\n📈 Total transaksi yang sukses dari start (${start}): ${chalk.yellow(txSuksesJumlah)}\n`)
                }
            } catch (e) {
                // jika pkey.txt not exist
                if (e.code == 'ENOENT') {
                    console.log('📝 Fill the pkey.txt first!');
                    fs.writeFileSync('pkey.txt', "0x000000\n0x000000\netc...")
                    process.exit()
                } else {
                    throw e
                }
            }
        } catch (e) {
            console.log(chalk.red(`⛔ Unable to connect RPC node, coba lagi!`))
        }
    }
})()