import { Web3 } from "web3";
import chalk from "chalk";
import fs from "fs";
import { runRainAIAll } from "./modules/rainai_module.js";
import { runRainPumpAll } from "./modules/rainpump_module.js";
import { sign } from "crypto";

const AMOUNT_ETH = "0.001"; // rekomendasi 0.005

async function getUserRainAI(address) {
    const url = `https://rain-ai.rainmakr.xyz/api/user/profile/${address}`

    const headers = {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.9',
        'origin': 'https://rainmakr.xyz',
        'priority': 'u=1, i',
        'referer': 'https://rainmakr.xyz/',
        'sec-ch-ua': '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
    }

    while(true) {
        try {
            const response = await fetch(url, {
                method: "GET",
                headers: headers
            })

            return await response.json()
        } catch (err) {
            console.log(chalk.red(`⛔ Error to get user run ai: ${err.message}`))
        }
    }
}

async function connectWalletRunAI(sign, address) {
    const url = "https://rain-ai.rainmakr.xyz/api/auth/connect-wallet"

    const payload = JSON.stringify({
      "signature": sign,
      "address": address
    })

    const headers = {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en,en-US;q=0.9,id;q=0.8',
        'content-type': 'application/json',
        'dnt': '1',
        'origin': 'https://rainmakr.xyz',
        'priority': 'u=1, i',
        'referer': 'https://rainmakr.xyz/',
        'sec-ch-ua': '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
    }

    while(true) {
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: headers,
                body: payload
            })

            return await response.json()
        } catch (err) {
            console.log(chalk.red(`⛔ Error to connect user run ai: ${err.message}`))
        }
    }
}

async function getUserRainPump(address) {
    const url = `https://api-pump.rainmakr.xyz/api/user/profile/${address}`

    const headers = {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en,en-US;q=0.9,id;q=0.8',
        'dnt': '1',
        'origin': 'https://rainmakr.xyz',
        'priority': 'u=1, i',
        'referer': 'https://rainmakr.xyz/',
        'sec-ch-ua': '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
    }

    while(true) {
        try {
            const response = await fetch(url, {
                method: "GET",
                headers: headers
            })

            return await response.json()
        } catch (err) {
            console.log(chalk.red(`⛔ Error to get user run pump: ${err.message}`))
        }
    }
}

async function connectWalletRunPump(sign, address) {
    const url = "https://api-pump.rainmakr.xyz/api/auth/connect-wallet"

    const payload = JSON.stringify({
      "signature": sign,
      "address": address
    })
    
    const headers = {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en,en-US;q=0.9,id;q=0.8',
        'content-type': 'application/json',
        'dnt': '1',
        'origin': 'https://rainmakr.xyz',
        'priority': 'u=1, i',
        'referer': 'https://rainmakr.xyz/',
        'sec-ch-ua': '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
    }

    while(true) {
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: headers,
                body: payload
            })

            return await response.json()
        } catch (err) {
            console.log(chalk.red(`⛔ Error to connect user run pump: ${err.message}`))
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
    
                let txSuksesJumlah = 0
                const start = new Date().toLocaleTimeString()
                while (true) {
                    console.log("💥 MegaETH Testnet Auto TX (Auto Register, RainAI Swap, RainPump Swap)")

                    console.log(`\n🚨 ${chalk.red(`GUNAKAN WALLET TESTNET, MARKET ORDER (TIDAK ADA KEPUTUSAN LAIN), HANYA TESTNET BUKAN ASET RIL!`)}`)
                    console.log(`🚨 ${chalk.yellow(`Swap di RainAI ETH ke MEGA setiap ${Number(AMOUNT_ETH)} dan swap kembali 99% saldo ke ETH`)}`)
                    console.log(`🚨 ${chalk.yellow(`Swap di RainPump ETH ke MEGA setiap ${Number(AMOUNT_ETH)} dan swap kembali 99% saldo ke ETH`)}`)
    
                    for (const pkey of pkeys) {
                        if (pkey!= '') {
                            // setupwallet part1
                            const wallet = web3.eth.accounts.privateKeyToAccount(pkey);
                            
                            //setupwallet part2
                            const balanceAcc = await web3.eth.getBalance(wallet.address)
                            let saldo = web3.utils.fromWei(balanceAcc, 'ether')
                            // console.log(saldo)
        
                            console.log(`\n🔑 EVM address: ${chalk.green(wallet.address)}\n🏦 Saldo: ${chalk.yellow(`${saldo} Mega ETH`)}`)
                            
                            const user = await getUserRainAI(wallet.address)
                            if(user.status_code == 200) {
                                console.log(`📝 Status registrasi RainAI: ✅`)
                            } else if (user.status_code == 400) {
                                console.log(`📝 Status registrasi RainAI: ❌`)
                                console.log(`   Sedang melakukan registrasi di RainAI...`)
                            }

                            // get signatur
                            const signature = wallet.sign("USER_CONNECT_WALLET").signature
                            await connectWalletRunAI(signature, wallet.address)

                            // setup wallet 3
                            const walletAddPkey = {
                                "pkey": pkey,
                                "address": wallet.address,
                            }

                            // rainai
                            const status_rainai = await runRainAIAll(web3, walletAddPkey, AMOUNT_ETH)
                            if(status_rainai != undefined) {
                                txSuksesJumlah = txSuksesJumlah+status_rainai
                            }
                            await new Promise(resolve => setTimeout(resolve, 400)) // delay 0.2 detik

                            const userPump = await getUserRainPump(wallet.address)
                            if(userPump.status_code == 200) {
                                console.log(`📝 Status registrasi RainPump: ✅`)
                            } else if (userPump.status_code == 400) {
                                console.log(`📝 Status registrasi RainPump: ❌`)
                                console.log(`   Sedang melakukan registrasi di RainPump...`)
                            }

                            // get signature pump
                            const signaturePump = wallet.sign("USER_CONNECT_WALLET").signature
                            await connectWalletRunPump(signaturePump, wallet.address)

                            // rainpump
                            const status_rainpump = await runRainPumpAll(web3, walletAddPkey, AMOUNT_ETH)
                            if(status_rainpump != undefined) {
                                txSuksesJumlah = txSuksesJumlah+status_rainpump
                            }
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