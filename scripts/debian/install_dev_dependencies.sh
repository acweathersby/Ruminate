#! /usr/bin/bash


# Install Tauri build dependencies
echo "Installing Dependencies"

sudo apt update 

sudo apt-get -y install libwebkit2gtk-4.0-dev \
    build-essential \
    curl \
    wget \
    libssl-dev \
    libgtk-3-dev \
    librsvg2-dev

if [[ !$? = 0 ]]
then
    echo "Unable to install base debendencies"
    exit 1
fi

# Install Node 
read -p "Install NVM (NodeJS + NPM)? (y/n)" -n 1 -r
echo    # (optional) move to a new line
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "Installing NodeJS"
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.2/install.sh | bash
fi

# Install Yarn
npm install -g yarn 

# Install Rust 
read -p "Install Rust (Rustup + Rust + Cargo)? (y/n)" -n 1 -r
echo    # (optional) move to a new line
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "Installing Rust "
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
fi

echo rustc --version

# Install Tauri 
echo "Your System is now setup to develop Ruminate"





