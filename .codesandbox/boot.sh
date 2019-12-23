#!/bin/bash

bootstrap() {
  unset bootstrap

  local LOCAL_INSTALL=/nr1
  local LOCAL_DIRECTORY=$LOCAL_INSTALL/usr/bin
  local LOCAL_BIN=$LOCAL_DIRECTORY/nr1

  # If the variable is not on the path, add it just in case.
  if [ $PATH != *"$LOCAL_DIRECTORY"* ]; then
    export PATH=$LOCAL_DIRECTORY:$PATH
  fi

  # If by now "nr1" could not be found, install it.
  if ! $(which nr1 > /dev/null); then
    local TEMP_FILE=$(mktemp)
    local BASE_REPO_URL="https://cli.nr-ext.net/deb"

    local BASE_FILE=$(
      curl -s $BASE_REPO_URL/Packages | \
        grep -oP '(?<=^Filename:).*$' | \
        sed -e 's/^\s\+\|\s\+$//g'
    );

    curl -s $BASE_REPO_URL/$BASE_FILE -o $TEMP_FILE
    dpkg -x $TEMP_FILE $LOCAL_INSTALL
    rm $TEMP_FILE

    echo "export PATH=$LOCAL_DIRECTORY:\$PATH" >> $HOME/.profile
    
    if ! $(which nr1 > /dev/null); then
      echo "Could not install NR1 CLI."
      return 1
    fi
  fi

  if [ -n "$API_KEY" ]; then
    CI=1 nr1 profiles:add --name nr1 --api-key "$API_KEY" --region us
  fi

  clear

  echo "Welcome to the \033[36mNew Relic\033[0m NR1 CodeSandbox template"
  echo "-------------------------------------------------"
  echo ""

  node ".codesandbox/server.js"
}

# Execute the bootstrapping function.
bootstrap
