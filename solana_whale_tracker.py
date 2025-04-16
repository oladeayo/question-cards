import os
import csv
import time
import json
import logging
import threading
import requests
import pandas as pd
import schedule
from io import StringIO
from datetime import datetime, timedelta
from telegram import Update, Bot
from telegram.ext import Application, CommandHandler, ContextTypes, CallbackContext

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# API Keys
SOLSCAN_API_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjcmVhdGVkQXQiOjE3NDQxMDExMTkzMDAsImVtYWlsIjoib2xhZGF5bzIyNUBnbWFpbC5jb20iLCJhY3Rpb24iOiJ0b2tlbi1hcGkiLCJhcGlWZXJzaW9uIjoidjIiLCJpYXQiOjE3NDQxMDExMTl9.V-xg_8KuxWzh2D0ZCQK9JQceuC8rapQPtehlQ6UnmcQ"
TELEGRAM_BOT_TOKEN = "7897119717:AAGJ1ZTjq766QeJSU_OQRSJoU2zycCZBSKI"

# Configuration settings
TOKEN_LIST_URL = "https://raw.githubusercontent.com/oladeayo/question-cards/refs/heads/main/CMC%20Solana%20Meme.csv"
MARKET_CAP_MIN = 10000000  # $1M minimum market cap
MARKET_CAP_MAX = 1000000000  # $100M maximum market cap
WHALE_THRESHOLD_PERCENT = 1  # Minimum 1% of total supply to be considered a whale
SIGNIFICANT_PURCHASE_PERCENT = 0.1  # 0.1% of total supply in a single transaction is significant
POLLING_INTERVAL = 300  # Check every 5 minutes
CHAT_ID = None  # Will be set when someone starts the bot

# Global state
token_data = {}
whale_addresses = {}
last_checked_activities = {}

# Headers for API requests
headers = {"token": SOLSCAN_API_TOKEN}

def fetch_token_list():
    """Fetch the list of tokens from the GitHub URL and convert to DataFrame"""
    try:
        response = requests.get(TOKEN_LIST_URL)
        response.raise_for_status()
        
        # Parse CSV data
        csv_data = StringIO(response.text)
        df = pd.read_csv(csv_data)
        
        logger.info(f"Fetched {len(df)} tokens from the token list")
        return df
    except Exception as e:
        logger.error(f"Error fetching token list: {e}")
        return pd.DataFrame()

def get_token_metadata(token_address):
    """Fetch metadata for a specific token"""
    url = f"https://pro-api.solscan.io/v2.0/token/meta?address={token_address}"
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        if data["success"]:
            return data["data"]
        else:
            logger.warning(f"Failed to get metadata for token {token_address}")
            return None
    except Exception as e:
        logger.error(f"Error fetching token metadata for {token_address}: {e}")
        return None

def fetch_token_holders(token_address, token_supply):
    """Fetch large holders (whales) for a specific token"""
    whale_minimum = token_supply * (WHALE_THRESHOLD_PERCENT / 100)
    page = 1
    page_size = 100
    all_whales = []
    
    while True:
        url = f"https://pro-api.solscan.io/v2.0/token/holders?address={token_address}&page={page}&page_size={page_size}"
        
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            if not data["success"] or len(data["data"]["items"]) == 0:
                break
                
            for holder in data["data"]["items"]:
                if float(holder["amount"]) >= whale_minimum:
                    all_whales.append(holder)
                else:
                    # If we've gone past the whale threshold, stop paginating
                    break
            
            # Go to next page
            page += 1
            
            # Don't make too many requests in a short time
            time.sleep(1)
            
        except Exception as e:
            logger.error(f"Error fetching token holders for {token_address}: {e}")
            break
    
    logger.info(f"Found {len(all_whales)} whales for token {token_address}")
    return all_whales

def fetch_defi_activities(token_address, wallet_address, last_checked_time=None):
    """Fetch recent DeFi activities for a specific wallet and token"""
    url = f"https://pro-api.solscan.io/v2.0/token/defi/activities?address={token_address}&from={wallet_address}&activity_type[]=ACTIVITY_TOKEN_SWAP&page=1&page_size=10&sort_by=block_time&sort_order=desc"
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        if not data["success"]:
            return []
            
        # Filter activities that occurred after the last check
        activities = data["data"]
        if last_checked_time:
            activities = [a for a in activities if a["block_time"] > last_checked_time]
            
        return activities
    except Exception as e:
        logger.error(f"Error fetching DeFi activities for {wallet_address} and token {token_address}: {e}")
        return []

def format_number(num):
    """Format large numbers for readability"""
    if num >= 1_000_000_000:
        return f"{num / 1_000_000_000:.2f}B"
    elif num >= 1_000_000:
        return f"{num / 1_000_000:.2f}M"
    elif num >= 1_000:
        return f"{num / 1_000:.2f}K"
    else:
        return f"{num:.2f}"

def format_token_amount(amount, decimals):
    """Convert token amount from raw to human-readable format"""
    return amount / (10 ** decimals)

def check_for_whale_activities():
    """Main function to check for whale activities"""
    global token_data, whale_addresses, last_checked_activities, CHAT_ID
    
    if CHAT_ID is None:
        logger.info("No active chat ID yet. Skipping whale activity check.")
        return
        
    logger.info("Checking for whale activities...")
    
    # Fetch token list if not already loaded
    if not token_data:
        token_df = fetch_token_list()
        
        if token_df.empty:
            logger.error("Could not load token list. Skipping whale activity check.")
            return
            
        # Process each token to get metadata and find whales
        for _, row in token_df.iterrows():
            token_address = row.get('token_address')
            
            if not token_address:
                continue
                
            # Get token metadata
            metadata = get_token_metadata(token_address)
            
            if not metadata:
                continue
                
            # Check if token meets market cap criteria
            market_cap = metadata.get('market_cap', 0)
            if market_cap < MARKET_CAP_MIN or market_cap > MARKET_CAP_MAX:
                continue
                
            # Store token data
            token_data[token_address] = {
                'name': metadata.get('name', 'Unknown'),
                'symbol': metadata.get('symbol', 'Unknown'),
                'decimals': metadata.get('decimals', 9),
                'supply': float(metadata.get('supply', '0')),
                'market_cap': market_cap,
                'price': metadata.get('price', 0)
            }
            
            # Find whales for this token
            token_supply = float(metadata.get('supply', '0'))
            whales = fetch_token_holders(token_address, token_supply)
            
            # Store whale addresses for this token
            whale_addresses[token_address] = [
                {'address': w['owner'], 'amount': float(w['amount'])} 
                for w in whales
            ]
            
            # Initialize last check time for this token's whales
            last_checked_activities[token_address] = {}
            for whale in whale_addresses[token_address]:
                last_checked_activities[token_address][whale['address']] = int(time.time())
    
    # Now check for new activities from whales
    current_time = int(time.time())
    
    for token_address, whales in whale_addresses.items():
        token_info = token_data[token_address]
        token_name = token_info['name']
        token_symbol = token_info['symbol']
        token_decimals = token_info['decimals']
        token_price = token_info['price']
        
        for whale in whales:
            whale_address = whale['address']
            whale_holdings = whale['amount']
            
            # Get latest activities
            last_checked = last_checked_activities[token_address].get(whale_address, 0)
            activities = fetch_defi_activities(token_address, whale_address, last_checked)
            
            # Update last checked time
            last_checked_activities[token_address][whale_address] = current_time
            
            # Process each activity
            for activity in activities:
                # Check if this is a purchase (swap)
                if 'routers' in activity:
                    routers = activity['routers']
                    
                    # Find which token was bought
                    if routers['token2'] == token_address:
                        # This is a buy of our tracked token
                        amount_bought = float(routers['amount2'])
                        amount_spent = float(routers['amount1'])
                        
                        # Convert to actual token amount
                        actual_amount = format_token_amount(amount_bought, token_decimals)
                        percentage_of_supply = (amount_bought / token_info['supply']) * 100
                        
                        # Check if this is a significant purchase
                        if percentage_of_supply >= SIGNIFICANT_PURCHASE_PERCENT:
                            # This is a significant purchase, send an alert!
                            token1_symbol = get_token_symbol(routers['token1'])
                            token1_decimals = routers['token1_decimals']
                            actual_spent = format_token_amount(amount_spent, token1_decimals)
                            
                            value_usd = actual_amount * token_price
                            
                            # Format the alert message
                            message = f"🚨 *WHALE ALERT* 🚨\n\n"
                            message += f"A whale has made a significant purchase of {token_symbol}!\n\n"
                            message += f"*Token:* {token_name} ({token_symbol})\n"
                            message += f"*Amount:* {format_number(actual_amount)} {token_symbol}\n"
                            message += f"*Value:* ${format_number(value_usd)}\n"
                            message += f"*Percentage of Supply:* {percentage_of_supply:.4f}%\n"
                            message += f"*Paid With:* {format_number(actual_spent)} {token1_symbol}\n\n"
                            message += f"*Whale Address:* `{whale_address}`\n"
                            message += f"*Transaction ID:* `{activity['trans_id']}`\n\n"
                            message += f"*Solscan TX Link:* [View Transaction](https://solscan.io/tx/{activity['trans_id']})\n"
                            message += f"*Solscan Wallet Link:* [View Wallet](https://solscan.io/account/{whale_address})"
                            
                            # Send the alert via Telegram
                            send_telegram_message(message)

def get_token_symbol(token_address):
    """Get token symbol from address - this is a simplified version and would need improvement"""
    if token_address == "So11111111111111111111111111111111111111112":
        return "SOL"
        
    # For other tokens, we would need to fetch their metadata
    # For simplicity in this demo, we'll just return a placeholder
    return "???"

def send_telegram_message(message):
    """Send a message via Telegram bot"""
    if not CHAT_ID:
        logger.warning("No chat ID set. Cannot send message.")
        return
        
    try:
        bot = Bot(token=TELEGRAM_BOT_TOKEN)
        bot.send_message(
            chat_id=CHAT_ID,
            text=message,
            parse_mode="Markdown",
            disable_web_page_preview=True
        )
        logger.info("Sent whale alert to Telegram")
    except Exception as e:
        logger.error(f"Error sending Telegram message: {e}")

# Telegram bot command handlers
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle the /start command"""
    global CHAT_ID
    CHAT_ID = update.effective_chat.id
    
    await update.message.reply_text(
        "🐳 *Solana Whale Tracker Bot* 🐳\n\n"
        "I'm tracking whale activities on Solana tokens!\n\n"
        "I'll send you alerts when whales make significant purchases.\n\n"
        "Commands:\n"
        "/start - Start the bot\n"
        "/status - Check bot status\n"
        "/settings - View current settings\n",
        parse_mode="Markdown"
    )
    
    # Start the monitoring if not already running
    if not token_data:
        # Run initial check
        threading.Thread(target=check_for_whale_activities).start()

async def status(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle the /status command"""
    tokens_tracked = len(token_data)
    whales_tracked = sum(len(whales) for whales in whale_addresses.values())
    
    await update.message.reply_text(
        "🐳 *Solana Whale Tracker Status* 🐳\n\n"
        f"*Tokens tracked:* {tokens_tracked}\n"
        f"*Whales tracked:* {whales_tracked}\n"
        f"*Market cap range:* ${format_number(MARKET_CAP_MIN)} - ${format_number(MARKET_CAP_MAX)}\n"
        f"*Whale threshold:* {WHALE_THRESHOLD_PERCENT}% of token supply\n"
        f"*Significant purchase:* {SIGNIFICANT_PURCHASE_PERCENT}% of token supply\n"
        f"*Polling interval:* {POLLING_INTERVAL} seconds\n",
        parse_mode="Markdown"
    )

async def settings(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle the /settings command"""
    await update.message.reply_text(
        "🐳 *Solana Whale Tracker Settings* 🐳\n\n"
        f"*Market cap minimum:* ${format_number(MARKET_CAP_MIN)}\n"
        f"*Market cap maximum:* ${format_number(MARKET_CAP_MAX)}\n"
        f"*Whale threshold:* {WHALE_THRESHOLD_PERCENT}% of token supply\n"
        f"*Significant purchase:* {SIGNIFICANT_PURCHASE_PERCENT}% of token supply\n"
        f"*Polling interval:* {POLLING_INTERVAL} seconds\n\n"
        "*Note:* Settings can't be changed via commands yet.",
        parse_mode="Markdown"
    )

def run_scheduler():
    """Run the scheduler for periodic checks"""
    schedule.every(POLLING_INTERVAL).seconds.do(check_for_whale_activities)
    
    while True:
        schedule.run_pending()
        time.sleep(1)

def main():
    """Start the bot and scheduler"""
    # Start scheduler in a separate thread
    scheduler_thread = threading.Thread(target=run_scheduler)
    scheduler_thread.daemon = True
    scheduler_thread.start()
    
    # Set up the Telegram bot
    application = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
    
    # Add command handlers
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("status", status))
    application.add_handler(CommandHandler("settings", settings))
    
    # Start the bot
    application.run_polling()

if __name__ == "__main__":
    main()