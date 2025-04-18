import { Web3 } from "web3";
import chalk from "chalk";
import { getGasEstimate } from "./gte_module.js";

const SC_ROUTER_RAINPUMP_ETH_MEGA = "0x6cefc3bf9813693aaccd59cffca3b0b2e54b0545"
const CA_MEGA = "0x4C9fAA236b5f383b95e42463998Bc3E8746c5366"

const swapETHMEGA = async (web3, account, amounteth) => {
    // eksekusi
    const saldoMy = web3.utils.fromWei(await web3.eth.getBalance(account.address), 'ether') // saldo eth saya
    const konversiETHWei = web3.utils.toWei(amounteth, "ether")
    // console.log(konversiETHWei)
    const konversiETHHex = web3.utils.toHex(Number(konversiETHWei))
    // console.log(typeof(konversiETHHex))
    
    if (Number(saldoMy) > Number(amounteth)+Number(0.001)) { // jika lebih dari amount+0.001 gaskan
        while (true) {
            const dataABI = `0x7ff36ab500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000080000000000000000000000000${String(account.address).split('0x')[1]}000000000000000000000000000000000000000000000000000009184e729fff00000000000000000000000000000000000000000000000000000000000000020000000000000000000000004eb2bd7bee16f38b1f4a0a5796fffd028b6040e90000000000000000000000004c9faa236b5f383b95e42463998bc3e8746c5366`
            // console.log(dataABI)
    
            await new Promise(resolve => setTimeout(resolve, 200)) // delay 0.2 detik
    
            while (true) {
                try {
                    const getgasprice = await web3.eth.getGasPrice() //1000000n
                    // console.log(getgasprice)

                    // estimasi gas dari address dengan sc dengan data dan value
                    const estGas = await web3.eth.estimateGas({
                        form: account.address,
                        to: SC_ROUTER_RAINPUMP_ETH_MEGA,
                        value: konversiETHHex,
                        data: dataABI
                    })
    
                    const estTxFee = web3.utils.fromWei(estGas, 'Gwei') * web3.utils.fromWei(getgasprice, "Gwei")
                    // console.log(estTxFee) 
    
                    const saldoMy = web3.utils.fromWei(await web3.eth.getBalance(account.address), 'ether') // saldo eth saya
    
                    if (estTxFee <= Number(saldoMy) && Number(saldoMy) >= 0) {
                        console.log("   Saldo ETH mencukupi, transaksi diproses...")
                        console.log(`🔄 Sedang melakukan swap ${chalk.yellow(`${Number(amounteth)} ETH`)} ke ${chalk.yellow("MEGA")}`)
    
                        // get fee data terkini
                        const feeData = await web3.eth.calculateFeeData();
    
                        // raw tx
                        const transaction = {
                            from: account.address,
                            to: SC_ROUTER_RAINPUMP_ETH_MEGA,
                            value: konversiETHHex,
                            gas: estGas,
                            gasprice: estGas,
                            maxFeePerGas: feeData.maxFeePerGas,
                            maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
                            nonce: await web3.eth.getTransactionCount(account.address),
                            data: dataABI,
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
                    console.log(chalk.red(`⛔ Tidak dapat melakukan swap karena ${err.message}`))
                    continue
                }
            }
        }   
    } else { // jika tidak mencukupi balance cusd skip dan return
        console.log(chalk.red(`⛔ Tidak dapat swap ETH ke MEGA karena balance ETH kurang dari ${Number(amounteth)+Number(0.001)} ETH`))
        return
    }
}

const approveSellMEGAETH = async (web3, account) => {
    // eksekusi 1 (approve cUSD) 
    const abiERC20 = [
        {
            "constant": false,
            "inputs": [
                {
                "internalType": "address",
                "name": "spender",
                "type": "address"
                },
                {
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
                }
            ],
            "name": "approve",
            "outputs": [
                {
                "internalType": "bool",
                "name": "",
                "type": "bool"
                }
            ],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [
                {
                "internalType": "address",
                "name": "",
                "type": "address"
                }
            ],
            "name": "balanceOf",
            "outputs": [
                {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        }
    ]

    let contract = new web3.eth.Contract(abiERC20, CA_MEGA)
    
    const balanceMyWei = await contract.methods.balanceOf(account.address).call()
    const balanceMyEther = web3.utils.fromWei(balanceMyWei, 'ether')
    console.log(`💲 Saldo MEGA: ${chalk.yellow(`${balanceMyEther} MEGA`)} `)

    if (Number(balanceMyEther) > 1) { // jika balance MEGA kita lebih besar dari 0 maka approve
        const tokenAmount = web3.utils.toWei(Math.floor(balanceMyEther), 'ether')
        const dataABI = contract.methods.approve(SC_ROUTER_RAINPUMP_ETH_MEGA, tokenAmount).encodeABI() // sc router bukan cusd
        // console.log(dataABI)

        while (true) {
            try {
                const getgasprice = await web3.eth.getGasPrice() //1000000n wei or 0.001 gwei
                // console.log(getgasprice)

                const resGasMethod = await getGasEstimate(account.address, CA_MEGA, dataABI)
                const estGas = BigInt(resGasMethod.result)
                // console.log(estGas)

                const estTxFee = web3.utils.fromWei(estGas, 'Gwei') * web3.utils.fromWei(getgasprice, "Gwei") 
                // console.log(estTxFee) 

                const saldoMy = web3.utils.fromWei(await web3.eth.getBalance(account.address), 'ether') // saldo eth saya

                if (estTxFee <= Number(saldoMy) && Number(saldoMy) >= 0) {
                    console.log("   Saldo ETH mencukupi, transaksi diproses...")
                    console.log(`✅ Sedang melakukan approve ${chalk.yellow(`${Math.floor(balanceMyEther)} testnet MEGA`)}`)

                    // get fee data terkini
                    const feeData = await web3.eth.calculateFeeData();

                    // raw tx
                    const transaction = {
                        from: account.address,
                        to: CA_MEGA,
                        gas: estGas,
                        gasprice: estGas,
                        maxFeePerGas: feeData.maxFeePerGas,
                        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
                        nonce: await web3.eth.getTransactionCount(account.address),
                        data: dataABI,
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
                            return [1, Math.floor(balanceMyEther)]
                        } else {
                            continue
                        }
                    } catch (err) {
                        console.log(chalk.red(`⛔ ${err.message}`))
                    }
                } else {
                    return [undefined, undefined]
                }
            } catch (err) {
                console.log(chalk.red(`⛔ Tidak dapat di approve karena ${err.message}`))
                continue
            }
        }
    } else { // jika tidak mencukupi balance mega skip dan return
        console.log(chalk.red(`⛔ Tidak dapat swap MEGA ke ETH karena balance MEGA kurang dari sama dengan 1`))
        return [undefined, undefined]
    }
}

const swapMEGAETH = async (web3, account) => { // 99% amount yang ada di wallet akan diswap
    // eksekusi 2
    const abiRouter = [
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "amountIn",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "amountOutMin",
                    "type": "uint256"
                },
                {
                    "internalType": "address[]",
                    "name": "path",
                    "type": "address[]"
                },
                {
                    "internalType": "address",
                    "name": "to",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "deadline",
                    "type": "uint256"
                }
            ],
            "name": "swapExactTokensForETH",
            "outputs": [
                {
                    "internalType": "uint256[]",
                    "name": "amounts",
                    "type": "uint256[]"
                }
            ],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ]

    const contract = new web3.eth.Contract(abiRouter, SC_ROUTER_RAINPUMP_ETH_MEGA)

    while (true) {
        const [status_approve, amountIn] = await approveSellMEGAETH(web3, account)
        if(status_approve==undefined) {
            return
        }

        const tokenAmountIn = web3.utils.toWei(amountIn, 'ether')

        const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // buat 20 menit dari sekarang

        const dataABI = contract.methods.swapExactTokensForETH(
            tokenAmountIn,
            0n,
            [CA_MEGA,"0x4eB2Bd7beE16F38B1F4a0A5796Fffd028b6040e9"],
            account.address,
            deadline
        ).encodeABI()
        // console.log(dataABI)

        await new Promise(resolve => setTimeout(resolve, 200)) // delay 0.2 detik

        while (true) { 
            try {
                const getgasprice = await web3.eth.getGasPrice() //1000000n
                // console.log(getgasprice)

                const resGasMethod = await getGasEstimate(account.address, SC_ROUTER_RAINPUMP_ETH_MEGA, dataABI)
                const estGas = BigInt(resGasMethod.result) // 140000n
                // console.log(estGas)

                const estTxFee = web3.utils.fromWei(estGas, 'Gwei') * web3.utils.fromWei(getgasprice, "Gwei")
                // console.log(estTxFee) 

                const saldoMy = web3.utils.fromWei(await web3.eth.getBalance(account.address), 'ether') // saldo eth saya

                if (estTxFee <= Number(saldoMy) && Number(saldoMy) >= 0) {
                    console.log("   Saldo ETH mencukupi, transaksi diproses...")
                    console.log(`🔄 Sedang melakukan swap ${chalk.yellow(`${amountIn} MEGA`)} ke ${chalk.yellow(`ETH`)}`)

                    // get fee data terkini
                    const feeData = await web3.eth.calculateFeeData();

                    // raw tx
                    const transaction = {
                        from: account.address,
                        to: SC_ROUTER_RAINPUMP_ETH_MEGA,
                        gas: estGas,
                        gasprice: estGas,
                        maxFeePerGas: feeData.maxFeePerGas,
                        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
                        nonce: await web3.eth.getTransactionCount(account.address),
                        data: dataABI,
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
                            if (status_approve == 1) {
                                return 2
                            }
                            if (status_approve == 2) {
                                return 1
                            }
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
                console.log(chalk.red(`⛔ Tidak dapat melakukan swap karena ${err.message}`))
                break
            }
        }
    }
}

const runRainPumpAll = async (provider, acc, amounteth) => {
    let txsukses = 0
    const status_swap_eth_mega = await swapETHMEGA(provider, acc, amounteth)
    if(status_swap_eth_mega != undefined) {
        txsukses += status_swap_eth_mega
    }

    const status_swap_mega_eth = await swapMEGAETH(provider, acc)
    if(status_swap_mega_eth != undefined) {
        txsukses += status_swap_mega_eth
    }
    return txsukses
}

export { runRainPumpAll }