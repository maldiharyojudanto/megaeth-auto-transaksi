import { Web3 } from "web3";
import chalk from "chalk";
import { SC_ROUTER_cUSD_WETH, getGasEstimate } from "./gte_module.js";

const SC_ROUTER_TEKO = "0x13C051431753FCE53eaEc02aF64a38A273E198d0" // supply wd

const CA_TOKEN_TEKO = [
    {
        "name": "tkUSD",
        "address": "0xFaf334e157175Ff676911AdcF0964D7f54F2C424", //tkUSD
        "mintdataleft": `0x40c10f19000000000000000000000000`,
        "mintdataright": `0000000000000000000000000000000000000000000000000000000077359400`,
        "decimal": "6", //mwei
        "unit": "mwei",
        "mintamount": 2000
    },
    {
        "name": "tkETH",
        "address": "0x176735870dc6C22B4EBFBf519DE2ce758de78d94", //tkETH
        "mintdataleft": `0x40c10f19000000000000000000000000`,
        "mintdataright": `0000000000000000000000000000000000000000000000000de0b6b3a7640000`,
        "decimal": "18", //ether
        "unit": "ether",
        "mintamount": 1
    },
    {
        "name": "tkWBTC",
        "address": "0xF82ff0799448630eB56Ce747Db840a2E02Cde4D8", //tkWBTC
        "mintdataleft": `0x40c10f19000000000000000000000000`,
        "mintdataright": `00000000000000000000000000000000000000000000000000000000001e8480`,
        "decimal": "9", //gwei
        "unit": "gwei",
        "mintamount": 0.02
    }
]

const mintToken = async (web3, account, indextoken) => {
    while(true) {
        try {
            // estimasi gas dari address dengan sc dengan data dan value
            const estGas = await web3.eth.estimateGas({
                form: account.address,
                to: `${CA_TOKEN_TEKO[indextoken].address}`,
                data: `${CA_TOKEN_TEKO[indextoken].mintdataleft+String(account.address).split('0x')[1]+CA_TOKEN_TEKO[indextoken].mintdataright}`
            })

            // get gas price
            const gasPrice = await web3.eth.getGasPrice()
            const estTxFee = web3.utils.fromWei(estGas, 'Gwei') * web3.utils.fromWei(gasPrice, "Gwei")
    
            const saldoMy = web3.utils.fromWei(await web3.eth.getBalance(account.address), 'ether') // saldo eth saya

            if (Number(estTxFee) <= Number(saldoMy) && Number(saldoMy) >= 0) {
                console.log("   Saldo ETH mencukupi, transaksi diproses...")
                console.log(`🔥 Sedang melakukan mint ${chalk.yellow(`${CA_TOKEN_TEKO[indextoken].mintamount} testnet ${CA_TOKEN_TEKO[indextoken].name}`)}`)
    
                // get fee data terkini
                const feeData = await web3.eth.calculateFeeData();
    
                // raw tx
                const transaction = {
                    from: account.address,
                    to: `${CA_TOKEN_TEKO[indextoken].address}`,
                    gasprice: estGas*4n,
                    maxFeePerGas: feeData.gasPrice,
                    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
                    nonce: await web3.eth.getTransactionCount(account.address),
                    data: `${CA_TOKEN_TEKO[indextoken].mintdataleft+String(account.address).split('0x')[1]+CA_TOKEN_TEKO[indextoken].mintdataright}`,
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
                        return 1 // sukses
                    } else {
                        continue
                    }
                } catch (err) {
                    console.log(chalk.red(`⛔ ${err.message}`))
                }
            } else {
                return // gagal = undifined
            }
        } catch (err) {
            console.log(chalk.red(`⛔ ${err.message}`))
        }
    }
}

const approvetkUSDC = async (web3, account, amount) => {
    // eksekusi 1 (approve tkusdc) 
    const abiERC20 = [
        {
            "constant": true,
            "inputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
                ],
                "name": "allowance",
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
        },
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

    let contract = new web3.eth.Contract(abiERC20, CA_TOKEN_TEKO[0].address)

    const izinkan = await contract.methods.allowance(account.address, SC_ROUTER_cUSD_WETH).call()
    const izinkanKah = izinkan!=0?chalk.green('Sudah'):chalk.red('Belum')
    // console.log(`❓ Apakah sudah di approve? ${izinkanKah}`)
    const jumlahIzin = web3.utils.fromWei(izinkan, 'mwei')
    
    const balanceMyWei = await contract.methods.balanceOf(account.address).call()
    const balanceMyEther = web3.utils.fromWei(balanceMyWei, 'mwei')
    console.log(`💲 Saldo tkUSDC: ${chalk.yellow(`${balanceMyEther} tkUSDC`)} `)

    if (Number(balanceMyEther) > Number(amount)) { // jika balance tkusdc kita lebih besar dari amount yang ingin di swap maka lakukan swap
        if(izinkan==0 || Number(jumlahIzin) < Number(amount)) { // jika belum di allow dan izin kurang dari jumlah yg mau di swap
            const tokenAmount = web3.utils.toWei(amount, 'mwei')
            const dataABI = contract.methods.approve(SC_ROUTER_cUSD_WETH, tokenAmount).encodeABI() // sc router bukan tkusdc
            // console.log(dataABI)
    
            while (true) {
                try {
                    const getgasprice = await web3.eth.getGasPrice() //1000000n wei or 0.001 gwei
                    // console.log(getgasprice)
    
                    const resGasMethod = await getGasEstimate(account.address, CA_TOKEN_TEKO[0].address, dataABI)
                    const estGas = BigInt(resGasMethod.result)
                    // console.log(estGas)
    
                    const estTxFee = web3.utils.fromWei(estGas, 'Gwei') * web3.utils.fromWei(getgasprice, "Gwei")
                    // console.log(estTxFee) 
    
                    const saldoMy = web3.utils.fromWei(await web3.eth.getBalance(account.address), 'ether') // saldo eth saya
    
                    if (estTxFee <= Number(saldoMy) && Number(saldoMy) >= 0) {
                        console.log("   Saldo ETH mencukupi, transaksi diproses...")
                        console.log(`✅ Sedang melakukan approve ${chalk.yellow(`${web3.utils.fromWei(tokenAmount, 'mwei')} testnet tkUSDC`)}`)
    
                        // get fee data terkini
                        const feeData = await web3.eth.calculateFeeData();
    
                        // raw tx
                        const transaction = {
                            from: account.address,
                            to: CA_TOKEN_TEKO[0].address,
                            gasprice: estGas*4n,
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
                    console.log(chalk.red(`⛔ Tidak dapat di approve karena ${err.message}`))
                }
            }
        } else { 
            console.log(`   Jumlah maksimal yang dapat di swap ${chalk.yellow(`${jumlahIzin} tkUSDC`)}`)
            return 2 // 1 berhasil
        }
    } else { // jika tidak mencukupi balance tkusdc skip dan return
        console.log(chalk.red(`⛔ Tidak dapat swap tkUSDC ke WETH karena balance tkUSDC kurang dari jumlah yang akan atau telah di approve`))
        return
    }
}

async function converttkUSDCtoWETH() { // 1 tkusdc => weth
    const url = "https://testnet.gte.xyz/api/rpc"

    const payload = JSON.stringify({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "eth_call",
        "params": [
            {
                "data": "0xd06ca61f00000000000000000000000000000000000000000000000000000000000f424000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000002000000000000000000000000faf334e157175ff676911adcf0964d7f54f2c424000000000000000000000000776401b9bc8aae31a685731b7147d4445fd9fb19",
                "to": "0xA6b579684E943F7D00d616A48cF99b5147fC57A5"
            },
            "latest"
        ]
    })

    const headers = {
        'origin': 'https://testnet.gte.xyz',
        'priority': 'u=1, i',
        'referer': 'https://testnet.gte.xyz/swap',
        'Content-Type': 'application/json'
    }

    while (true) {
        try {
            const response = await fetch(url, {
                method: "POST",
                body: payload,
                headers: headers
            })

            if (!response.ok) {
                throw new Error(`${response.status} ${response.statusText}`)
            }

            return await response.json()
        } catch (err) {
            console.log(chalk.red(`⛔ ${err.message}`))
        }
    }
}

const swaptkUSDCETH = async (web3, account, amount) => {
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

    const contract = new web3.eth.Contract(abiRouter, SC_ROUTER_cUSD_WETH)

    const tokenAmountIn = web3.utils.toWei(amount, 'mwei') // mwei bukan ether

    while (true) {
        const convert_tkusdc_weth = await converttkUSDCtoWETH()  // dapatkan konversi 1 tkusdc ke eth saat ini
        
        const hex_cv_tkusdc_weth = convert_tkusdc_weth.result; // ambil result tipe uint256 0x
        let cv_tkusdc_weth = hex_cv_tkusdc_weth.slice(2);  // hilangkan 0x
        const cv_tkusdc_weth_32 = cv_tkusdc_weth.match(/.{1,64}/g); // bagi array of 32-byte words (4 bagian)
        cv_tkusdc_weth ="0x"+cv_tkusdc_weth_32[cv_tkusdc_weth_32.length - 1] // konversi ke hex
        
        const tokenAmountOut = BigInt(cv_tkusdc_weth)*BigInt(web3.utils.fromWei(tokenAmountIn, 'mwei')) // 1 tkusdc * Amount in
        const tokenAmountOutWithSlippage = tokenAmountOut - ((tokenAmountOut * 1n) / 100n) // 1% slippage
        
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // buat 20 menit dari sekarang

        const dataABI = contract.methods.swapExactTokensForETH(
            tokenAmountIn,
            tokenAmountOutWithSlippage,
            [CA_TOKEN_TEKO[0].address,"0x776401b9BC8aAe31A685731B7147D4445fD9FB19"],
            account.address,
            deadline
        ).encodeABI()
        // console.log(dataABI)

        const status_approve = await approvetkUSDC(web3, account, amount)
        if(status_approve==undefined) {
            return
        }
        await new Promise(resolve => setTimeout(resolve, 200)) // delay 0.2 detik

        while (true) { 
            try {
                const getgasprice = await web3.eth.getGasPrice() //1000000n
                // console.log(getgasprice)

                const resGasMethod = await getGasEstimate(account.address, SC_ROUTER_cUSD_WETH, dataABI)
                const estGas = BigInt(resGasMethod.result) // 140000n
                // console.log(estGas)

                const estTxFee = web3.utils.fromWei(estGas, 'Gwei') * web3.utils.fromWei(getgasprice, "Gwei")
                // console.log(estTxFee) 

                const saldoMy = web3.utils.fromWei(await web3.eth.getBalance(account.address), 'ether') // saldo eth saya

                if (estTxFee <= Number(saldoMy) && Number(saldoMy) >= 0) {
                    console.log("   Saldo ETH mencukupi, transaksi diproses...")
                    console.log(`🔄 Sedang melakukan swap ${chalk.yellow(`${web3.utils.fromWei(tokenAmountIn, 'mwei')} tkUSDC`)} ke ${chalk.yellow(`${web3.utils.fromWei(tokenAmountOutWithSlippage, 'ether')} ETH`)}`)
                    console.log(`   Amount in: ${chalk.yellow(`${web3.utils.fromWei(tokenAmountIn, 'mwei')} tkUSDC`)}`)
                    console.log(`   Amount out min (slippage 1%): ${chalk.yellow(`${web3.utils.fromWei(tokenAmountOutWithSlippage, 'ether')} ETH`)}`)

                    // get fee data terkini
                    const feeData = await web3.eth.calculateFeeData();

                    // raw tx
                    const transaction = {
                        from: account.address,
                        to: SC_ROUTER_cUSD_WETH,
                        gasprice: estGas*4n,
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

const approvetkETH = async (web3, account) => {
    // eksekusi 1 (approve tkETH) 
    const abiERC20 = [
        {
            "constant": true,
            "inputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
                ],
                "name": "allowance",
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
        },
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

    let contract = new web3.eth.Contract(abiERC20, CA_TOKEN_TEKO[1].address)

    const izinkan = await contract.methods.allowance(account.address, SC_ROUTER_TEKO).call()
    const izinkanKah = izinkan!=0?chalk.green('Sudah'):chalk.red('Belum')
    // console.log(`❓ Apakah sudah di approve? ${izinkanKah}`)
    const jumlahIzin = web3.utils.fromWei(izinkan, 'ether')

    const balanceMyWei = await contract.methods.balanceOf(account.address).call()
    const balanceMyEther = web3.utils.fromWei(balanceMyWei, 'ether')
    console.log(`💲 Saldo tkETH: ${chalk.yellow(`${balanceMyEther} tkETH`)} `)

    if (Number(balanceMyEther) > Number(10)) { // jika balance tkETH kita lebih besar dari amount yang ingin di depo maka lakukan depp
        if(izinkan==0 || Number(jumlahIzin) < Number(10)) { // jika belum di allow dan izin kurang dari jumlah yg mau di depo
            const tokenAmount = web3.utils.toWei("10", 'ether')
            const dataABI = contract.methods.approve(SC_ROUTER_TEKO, tokenAmount).encodeABI() // sc router bukan tketh
            // console.log(dataABI)

            while (true) {
                try {
                    const getgasprice = await web3.eth.getGasPrice() //1000000n wei or 0.001 gwei
                    // console.log(getgasprice)

                    const resGasMethod = await getGasEstimate(account.address, CA_TOKEN_TEKO[1].address, dataABI)
                    const estGas = BigInt(resGasMethod.result)
                    // console.log(estGas)

                    const estTxFee = web3.utils.fromWei(estGas, 'Gwei') * web3.utils.fromWei(getgasprice, "Gwei")
                    // console.log(estTxFee) 

                    const saldoMy = web3.utils.fromWei(await web3.eth.getBalance(account.address), 'ether') // saldo eth saya

                    if (estTxFee <= Number(saldoMy) && Number(saldoMy) >= 0) {
                        console.log("   Saldo ETH mencukupi, transaksi diproses...")
                        console.log(`✅ Sedang melakukan approve ${chalk.yellow(`${web3.utils.fromWei(tokenAmount, 'ether')} testnet tkETH`)}`)

                        // get fee data terkini
                        const feeData = await web3.eth.calculateFeeData();

                        // raw tx
                        const transaction = {
                            from: account.address,
                            to: CA_TOKEN_TEKO[1].address,
                            gasprice: estGas*4n,
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
                    console.log(chalk.red(`⛔ Tidak dapat di approve karena ${err.message}`))
                }
            }
        } else {
            console.log(`   Jumlah maksimal yang dapat di deposit ${chalk.yellow(`${String(jumlahIzin).slice(0,5)}........ tkETH`)}`)
            return 2
        }
    } else { // jika tidak mencukupi balance tkETH skip dan return
        console.log(chalk.red(`⛔ Tidak dapat deposit tkETH karena balance kurang dari 10 tkETH`))
        return
    }
}

const deposittkETH= async (web3, account) => {
    // eksekusi 2
    while (true) {
        const data = `0x8dbdbe6da072655079714a39e433a54033b0e9125a53289162398442302899c8f56f3f910000000000000000000000000000000000000000000000008ac7230489e80000000000000000000000000000${String(account.address).split('0x')[1]}`
        // console.log(data)

        const status_approve = await approvetkETH(web3, account)
        if(status_approve==undefined) {
            return
        }
        await new Promise(resolve => setTimeout(resolve, 200)) // delay 0.2 detik

        while (true) { 
            try {
                const getgasprice = await web3.eth.getGasPrice() 
                // console.log(getgasprice)

                const resGasMethod = await getGasEstimate(account.address, SC_ROUTER_TEKO, data)
                const estGas = BigInt(resGasMethod.result) 
                // console.log(estGas)

                const estTxFee = web3.utils.fromWei(estGas, 'Gwei') * web3.utils.fromWei(getgasprice, "Gwei")
                // console.log(estTxFee) 

                const saldoMy = web3.utils.fromWei(await web3.eth.getBalance(account.address), 'ether') // saldo eth saya

                if (estTxFee <= Number(saldoMy) && Number(saldoMy) >= 0) {
                    console.log("   Saldo ETH mencukupi, transaksi diproses...")
                    console.log(`📥 Sedang melakukan deposit ${chalk.yellow(`10 tkETH`)}`)

                    // get fee data terkini
                    const feeData = await web3.eth.calculateFeeData();

                    // raw tx
                    const transaction = {
                        from: account.address,
                        to: SC_ROUTER_TEKO,
                        gasprice: estGas*4n,
                        maxFeePerGas: feeData.maxFeePerGas,
                        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
                        nonce: await web3.eth.getTransactionCount(account.address),
                        data: data,
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
                console.log(chalk.red(`⛔ Tidak dapat melakukan deposit karena ${err.message}`))
                break
            }
        }
    }
}

async function depositETHJumlah(address) {
    const url = "https://carrot.megaeth.com/rpc"

    const payload = JSON.stringify({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "eth_call",
        "params": [
            {
                "data": `0x9afdcd57a072655079714a39e433a54033b0e9125a53289162398442302899c8f56f3f91000000000000000000000000${String(address).split('0x')[1]}`,
                "to": "0x13C051431753FCE53eaEc02aF64a38A273E198d0"
            },
            "latest"
        ]
    })
    
    const headers = {
        'accept': '*/*',
        'accept-language': 'en,en-US;q=0.9,id;q=0.8',
        'content-type': 'application/json'
    }

    while (true) {
        try {
            const response = await fetch(url, {
                method: "POST",
                body: payload,
                headers: headers
            })

            if (!response.ok) {
                throw new Error(`${response.status} ${response.statusText}`)
            }

            return await response.json()
        } catch (err) {
            console.log(chalk.red(`⛔ ${err.message}`))
        }
    }
}

const withdrawtkETH = async (web3, account, jumlahdepo) => {
    // eksekusi 2
    const abiERC20 = [
        {
            "constant": true,
            "inputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
                ],
                "name": "allowance",
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

    let contract = new web3.eth.Contract(abiERC20, CA_TOKEN_TEKO[1].address)

    const izinkan = await contract.methods.allowance(account.address, SC_ROUTER_TEKO).call()
    const izinkanKah = izinkan!=0?chalk.green('Sudah'):chalk.red('Belum')
    // console.log(`❓ Apakah sudah di approve? ${izinkanKah}`)
    const jumlahIzin = web3.utils.fromWei(izinkan, 'ether')
    // console.log(Number(jumlahdepo), Number(jumlahIzin)) 

    while (true) {
        const data = `0x71b3177aa072655079714a39e433a54033b0e9125a53289162398442302899c8f56f3f910000000000000000000000000000000000000000000000000de0b6b3a7640000000000000000000000000000${String(account.address).split('0x')[1]}000000000000000000000000${String(account.address).split('0x')[1]}`
        // console.log(data)

        if (Number(jumlahdepo) > 1) {
            await new Promise(resolve => setTimeout(resolve, 200)) // delay 1 detik

            while (true) { 
                try {
                    const getgasprice = await web3.eth.getGasPrice() 
                    // console.log(getgasprice)

                    const resGasMethod = await getGasEstimate(account.address, SC_ROUTER_TEKO, data)
                    const estGas = BigInt(resGasMethod.result) 
                    // console.log(estGas)

                    const estTxFee = web3.utils.fromWei(estGas, 'Gwei') * web3.utils.fromWei(getgasprice, "Gwei")
                    // console.log(estTxFee) 

                    const saldoMy = web3.utils.fromWei(await web3.eth.getBalance(account.address), 'ether') // saldo eth saya

                    if (estTxFee <= Number(saldoMy) && Number(saldoMy) >= 0) {
                        console.log("   Saldo ETH mencukupi, transaksi diproses...")
                        console.log(`📤 Sedang melakukan withdraw ${chalk.yellow(`1 tkETH`)}`)

                        // get fee data terkini
                        const feeData = await web3.eth.calculateFeeData();

                        // raw tx
                        const transaction = {
                            from: account.address,
                            to: SC_ROUTER_TEKO,
                            gasprice: estGas*4n,
                            maxFeePerGas: feeData.maxFeePerGas,
                            maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
                            nonce: await web3.eth.getTransactionCount(account.address),
                            data: data,
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
                    console.log(chalk.red(`⛔ Tidak dapat melakukan withdraw karena ${err.message}`))
                    break
                }
            }
        } else {
            console.log(chalk.red(`⛔ Tidak dapat withdraw tkETH karena jumlah deposit atau jumlah approve tkETH kurang`))
            return
        }
    }
}


const approvetkWBTC = async (web3, account, amount) => {
    // eksekusi 1 (approve wbtc) 
    const abiERC20 = [
        {
            "constant": true,
            "inputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
                ],
                "name": "allowance",
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
        },
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

    let contract = new web3.eth.Contract(abiERC20, CA_TOKEN_TEKO[2].address)

    const izinkan = await contract.methods.allowance(account.address, SC_ROUTER_cUSD_WETH).call()
    const izinkanKah = izinkan!=0?chalk.green('Sudah'):chalk.red('Belum')
    // console.log(`❓ Apakah sudah di approve? ${izinkanKah}`)
    const jumlahIzin = web3.utils.fromWei(izinkan, 'gwei')/10
    
    const balanceMyWei = await contract.methods.balanceOf(account.address).call()
    const balanceMyEther = web3.utils.fromWei(balanceMyWei, 'gwei')*10
    console.log(`💲 Saldo tkWBTC: ${chalk.yellow(`${balanceMyEther} tkWBTC`)} `)

    if (Number(balanceMyEther) > Number(amount)) { // jika balance tkwbtc kita lebih besar dari amount yang ingin di swap maka lakukan swap
        if(izinkan==0 || Number(jumlahIzin) < Number(amount)) { // jika belum di allow dan izin kurang dari jumlah yg mau di swap
            const tokenAmount = web3.utils.toWei(amount, 'gwei')/10
            const dataABI = contract.methods.approve(SC_ROUTER_cUSD_WETH, tokenAmount).encodeABI() // sc router bukan tkwbtc
            // console.log(dataABI)
    
            while (true) {
                try {
                    const getgasprice = await web3.eth.getGasPrice() //1000000n wei or 0.001 gwei
                    // console.log(getgasprice)
    
                    const resGasMethod = await getGasEstimate(account.address, CA_TOKEN_TEKO[2].address, dataABI)
                    const estGas = BigInt(resGasMethod.result)
                    // console.log(estGas)
    
                    const estTxFee = web3.utils.fromWei(estGas, 'Gwei') * web3.utils.fromWei(getgasprice, "Gwei") 
                    // console.log(estTxFee) 
    
                    const saldoMy = web3.utils.fromWei(await web3.eth.getBalance(account.address), 'ether') // saldo eth saya
    
                    if (estTxFee <= Number(saldoMy) && Number(saldoMy) >= 0) {
                        console.log("   Saldo ETH mencukupi, transaksi diproses...")
                        console.log(`✅ Sedang melakukan approve ${chalk.yellow(`${web3.utils.fromWei(tokenAmount, 'gwei')*10} testnet tkWBTC`)}`)
    
                        // get fee data terkini
                        const feeData = await web3.eth.calculateFeeData();
    
                        // raw tx
                        const transaction = {
                            from: account.address,
                            to: CA_TOKEN_TEKO[2].address,
                            gasprice: estGas*4n,
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
                    console.log(chalk.red(`⛔ Tidak dapat di approve karena ${err.message}`))
                }
            }
        } else { // jika 
            console.log(`   Jumlah maksimal yang dapat di swap ${chalk.yellow(`${jumlahIzin} tkWBTC`)}`)
            return 2
        }
    } else { // jika tidak mencukupi balance tkwbtc skip dan return
        console.log(chalk.red(`⛔ Tidak dapat swap tkWBTC ke WETH karena balance tkWBTC kurang dari jumlah yang akan atau telah di approve`))
        return
    }
}

async function converttkWBTCtoWETH() { // cv 1 wbtc => weth
    const url = "https://testnet.gte.xyz/api/rpc"

    const payload = JSON.stringify({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "eth_call",
        "params": [
            {
                "data": "0xd06ca61f0000000000000000000000000000000000000000000000000000000005f5e10000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000002000000000000000000000000f82ff0799448630eb56ce747db840a2e02cde4d8000000000000000000000000776401b9bc8aae31a685731b7147d4445fd9fb19",
                "to": "0xA6b579684E943F7D00d616A48cF99b5147fC57A5"
            },
            "latest"
        ]
    })

    const headers = {
        'origin': 'https://testnet.gte.xyz',
        'priority': 'u=1, i',
        'referer': 'https://testnet.gte.xyz/swap',
        'Content-Type': 'application/json'
    }

    while (true) {
        try {
            const response = await fetch(url, {
                method: "POST",
                body: payload,
                headers: headers
            })

            if (!response.ok) {
                throw new Error(`${response.status} ${response.statusText}`)
            }

            return await response.json()
        } catch (err) {
            console.log(chalk.red(`⛔ ${err.message}`))
        }
    }
}

const swaptkWBTCETH = async (web3, account, amount) => {
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

    const contract = new web3.eth.Contract(abiRouter, SC_ROUTER_cUSD_WETH)

    const tokenAmountIn = web3.utils.toWei(amount, 'gwei')/10

    while (true) {
        const convert_tkwbtc_weth = await converttkWBTCtoWETH()  // dapatkan konversi 1 tkwbtc ke eth saat ini
        
        const hex_cv_tkwbtc_weth = convert_tkwbtc_weth.result; // ambil result tipe uint256 0x
        let cv_tkwbtc_weth = hex_cv_tkwbtc_weth.slice(2);  // hilangkan 0x
        const cv_tkwbtc_weth_32 = cv_tkwbtc_weth.match(/.{1,64}/g); // bagi array of 32-byte words (4 bagian)
        cv_tkwbtc_weth ="0x"+cv_tkwbtc_weth_32[cv_tkwbtc_weth_32.length - 1] // konversi ke hex
        
        const tokenAmountOut = Number(cv_tkwbtc_weth)*Number(web3.utils.fromWei(tokenAmountIn*10, 'gwei')) // 1 tkwbtc * Amount in
        const tokenAmountOutWithSlippage = Number(tokenAmountOut - ((tokenAmountOut * 1) / 100)).toFixed() // 1% slippage
        const tokenAmountOutWithSlippageBig = BigInt(tokenAmountOutWithSlippage)
        
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // buat 20 menit dari sekarang

        const dataABI = contract.methods.swapExactTokensForETH(
            tokenAmountIn,
            tokenAmountOutWithSlippageBig,
            [CA_TOKEN_TEKO[2].address, "0x776401b9BC8aAe31A685731B7147D4445fD9FB19"],
            account.address,
            deadline
        ).encodeABI()
        // console.log(dataABI)

        const status_approve = await approvetkWBTC(web3, account, amount)
        if(status_approve==undefined) {
            return
        }
        await new Promise(resolve => setTimeout(resolve, 200)) // delay 0.2 detik

        while (true) { 
            try {
                const getgasprice = await web3.eth.getGasPrice() //1000000n
                // console.log(getgasprice)

                const resGasMethod = await getGasEstimate(account.address, SC_ROUTER_cUSD_WETH, dataABI)
                const estGas = BigInt(resGasMethod.result) // 140000n
                // console.log(estGas)

                const estTxFee = web3.utils.fromWei(estGas, 'Gwei') * web3.utils.fromWei(getgasprice, "Gwei")
                // console.log(estTxFee) 

                const saldoMy = web3.utils.fromWei(await web3.eth.getBalance(account.address), 'ether') // saldo eth saya

                if (estTxFee <= Number(saldoMy) && Number(saldoMy) >= 0) {
                    console.log("   Saldo ETH mencukupi, transaksi diproses...")
                    console.log(`🔄 Sedang melakukan swap ${chalk.yellow(`${web3.utils.fromWei(tokenAmountIn, 'gwei')*10} tkWBTC`)} ke ${chalk.yellow(`${web3.utils.fromWei(tokenAmountOutWithSlippage, 'ether')} ETH`)}`)
                    console.log(`   Amount in: ${chalk.yellow(`${web3.utils.fromWei(tokenAmountIn, 'gwei')*10} tkWBTC`)}`)
                    console.log(`   Amount out min (slippage 1%): ${chalk.yellow(`${web3.utils.fromWei(tokenAmountOutWithSlippage, 'ether')} ETH`)}`)

                    // get fee data terkini
                    const feeData = await web3.eth.calculateFeeData();

                    // raw tx
                    const transaction = {
                        from: account.address,
                        to: SC_ROUTER_cUSD_WETH,
                        gasprice: estGas*4n,
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

const runTekoAll = async (connector, acc, amountswaptkusdc, amountswaptkwbtc) => {
    let txsuses = 0
    for (let i=0;i<CA_TOKEN_TEKO.length; i++) {
        const mintkan = await mintToken(connector, acc, i) // mint
        if(mintkan == 1) {
            txsuses += 1
        }

        if (i == 0) {
            const stat_swap_tkusdc = await swaptkUSDCETH(connector, acc, amountswaptkusdc) // swap tkusdc => weth
            if(stat_swap_tkusdc != undefined) {
                txsuses = txsuses+stat_swap_tkusdc
            }
        }

        if (i == 1) {
            const stat_depo_tketh = await deposittkETH(connector, acc) // depo 10 eth
            if(stat_depo_tketh != undefined) {
                txsuses = txsuses+stat_depo_tketh
            }

            const totalDepo = await depositETHJumlah(acc.address)
            const jumDepo = connector.utils.fromWei(totalDepo.result, 'ether')
            console.log(`💲 Total deposit tkETH: ${chalk.yellow(`${Number(jumDepo).toFixed(3)} tkETH`)} `)

            const stat_wd_tketh = await withdrawtkETH(connector, acc, jumDepo) // wd 1 eth
            if(stat_wd_tketh == 1) {
                txsuses += 1
            }
        }
        if (i == 2) {
            const stat_swap_tkwbtc = await swaptkWBTCETH(connector, acc, amountswaptkwbtc) // swap tkwbtc => weth
            if(stat_swap_tkwbtc != undefined) {
                txsuses = txsuses+stat_swap_tkwbtc
            }
        }
    } 
    return txsuses
}

export { runTekoAll }