#!/bin/sh


# Log the start of the script
echo "Starting start-dev.sh script..."

# Print all executed commands
set -x 


# Print current user
echo "Current user: $(whoami)"
cd /app

# Change permissions of .next directory
# chmod -R 755 /app/.next

# Find directories and set permissions to 755
# find /app/.next -type d -exec chmod 755 {} \;
# find /app/node_modules -type d -exec chmod 755 {} \;

# Find files and set permissions to 644
# find /app/node_modules -type f -exec chmod 644 {} \;
# find /app/.next -type f -exec chmod 644 {} \;

# Debugging: Check directory permissions after modifications
ls -la /app

ls -la /app/node_modules
ls -la /app/.next


# Find directories not set to 755
# echo "Directories not set to 755: "
# find /app -type d ! -perm 755 -print

# # Find files not set to 644
# echo "Files not set to 644: "e24abeb1ee09
# find /app -type f ! -perm 644 -print
# Run npm run dev in the background

# # Use the 'root' user to execute npm commands
# su - root -c "npm run dev" &

# # Capture the PID of the background process
# PID=$!

# # Wait for npm run dev to finish
# wait $PID

# Run npm run dev in the background
npm run dev &
PID=$!

# Wait for npm run dev to finish
wait $PID

# Log the end of the script
echo "start-dev.sh script completed."
