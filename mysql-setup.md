# Quick MySQL Setup for Simulation Platform

Since MySQL is not currently installed on your system, here's how to get it running quickly:

## Option 1: Install MySQL via Homebrew (Recommended for macOS)

```bash
# Install MySQL
brew install mysql

# Start MySQL service
brew services start mysql

# Secure the installation (this will prompt you to set a root password)
mysql_secure_installation
```

**Follow the prompts:**
- Set a root password (remember this!)
- Remove anonymous users: `Y`
- Disallow root login remotely: `Y`
- Remove test database: `Y`
- Reload privilege tables: `Y`

## Option 2: Download MySQL Installer

1. Go to [MySQL Downloads](https://dev.mysql.com/downloads/mysql/)
2. Download "MySQL Community Server" for macOS
3. Run the installer and follow the setup wizard
4. Remember the root password you set

## Create the Database

After installing MySQL, create the required database:

```bash
# Connect to MySQL and create the database
mysql -u root -p -e "CREATE DATABASE simulations;"
```

## Update Your .env File

Edit your `.env` file with the MySQL password you set:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=simulations
DB_USERNAME=root
DB_PASSWORD=your_mysql_password_here

# Server Configuration
SERVER_HOST=localhost
SERVER_PORT=3000
```

## Test the Setup

```bash
# Test MySQL connection
mysql -u root -p -e "SHOW DATABASES;"

# You should see 'simulations' in the list
```

## Start the Backend

```bash
# Start the simple backend server
npm run dev:simple
```

## Troubleshooting

### "Command not found: mysql"
- Make sure MySQL is installed and in your PATH
- Try restarting your terminal after installation

### "Access denied for user 'root'@'localhost'"
- Make sure you're using the correct password
- Try resetting the root password if needed

### "Can't connect to MySQL server"
- Make sure MySQL service is running: `brew services list | grep mysql`
- Start it if needed: `brew services start mysql`

## Alternative: Use SQLite (Coming Soon)

If you prefer not to install MySQL, I can create a SQLite version of the database concept that doesn't require a separate database server.

---

**Once MySQL is installed and running, you can start the backend with:**
```bash
npm run dev:simple
```
