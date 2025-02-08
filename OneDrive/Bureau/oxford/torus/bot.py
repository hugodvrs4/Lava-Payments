import discord
from discord.ext import commands
from web3 import Web3


INFURA_URL = "https://polygon-mumbai.infura.io/v3/300447c9154f445f909b580abbd555ff" 
CONTRACT_ADDRESS = "0x..." 
CONTRACT_ABI = [...]  


web3 = Web3(Web3.HTTPProvider(INFURA_URL))
contract = web3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI)


intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix="!", intents=intents)

@bot.event
async def on_ready():
    print(f'Bot connecté en tant que {bot.user}')

@bot.event
async def on_message(message):
    if message.author == bot.user:
        return


    tx_hash = contract.functions.addMessage(
        str(message.content),
        str(message.author.id),
        str(message.guild.id)
    ).transact({
        'from': web3.eth.accounts[0],  
        'gas': 2000000
    })
    print(f"Message enregistré sur la blockchain : {tx_hash}")

    await bot.process_commands(message)

bot.run(' MTMzNzU0OTIyNDI4NzY2NjMyOQ.GNVz01.aQyWWHYEuJJ6054-2tqJymW1ZVOxAcizqCcNNA ')  