{
  description = "Habits React Native App.";
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
  };
  outputs = { nixpkgs, ... }:
  let
    pkgs = import nixpkgs { system = "x86_64-linux"; config.allowUnfree = true; };
  in
  {
    devShells.x86_64-linux.default = pkgs.mkShell {
      buildInputs = [ 
        pkgs.nodejs_22 
        pkgs.mongodb 
        pkgs.mongosh
        # Script to start MongoDB server
        (pkgs.writeShellScriptBin "start-mongodb" ''
          mkdir -p ./mongodb-data
          echo "Starting MongoDB server on port 27017..."
          echo "Data directory: $(pwd)/mongodb-data"
          mongod --dbpath ./mongodb-data --port 27017 --bind_ip 127.0.0.1
        '')
        # Script to connect to MongoDB shell
        (pkgs.writeShellScriptBin "mongodb-shell" ''
          echo "Connecting to MongoDB shell..."
          mongosh mongodb://localhost:27017
        '')
        # Script to stop MongoDB (if running in background)
        (pkgs.writeShellScriptBin "stop-mongodb" ''
          echo "Stopping MongoDB..."
          pkill -f mongod || echo "No MongoDB process found"
        '')
      ];
      
      shellHook = ''
        # Temporarily open common Expo/Metro ports
        sudo iptables -I INPUT -p tcp --dport 8081 -j ACCEPT 2>/dev/null || true
        sudo iptables -I INPUT -p tcp --dport 19000 -j ACCEPT 2>/dev/null || true
        sudo iptables -I INPUT -p tcp --dport 19001 -j ACCEPT 2>/dev/null || true
        sudo iptables -I INPUT -p tcp --dport 19002 -j ACCEPT 2>/dev/null || true
        
        # MongoDB port
        sudo iptables -I INPUT -p tcp --dport 27017 -j ACCEPT 2>/dev/null || true
        
        # Backend API server port
        sudo iptables -I INPUT -p tcp --dport 3001 -j ACCEPT 2>/dev/null || true
        
        echo "Available commands:"
        echo "  start-mongodb  - Start MongoDB server"
        echo "  mongodb-shell  - Connect to MongoDB shell"
        echo "  stop-mongodb   - Stop MongoDB server"
        echo ""
      '';
    };
  };
}
