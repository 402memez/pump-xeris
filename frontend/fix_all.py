import os, re

# 1. Fix the Lag in RocketGame.jsx
rg_path = 'src/components/RocketGame.jsx'
with open(rg_path, 'r') as f:
    rg_code = f.read()

# Change the chunky 0.1 visual throttle to a buttery smooth 0.01
rg_code = rg_code.replace('< 0.1', '< 0.01')
with open(rg_path, 'w') as f:
    f.write(rg_code)

# 2. Hunt down and destroy all fiat $ signs in the UI
for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.jsx'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()
            
            # Removes $ right before numbers (e.g., $100 -> 100, $ 8,796 -> 8,796)
            new_content = re.sub(r'\$\s*(?=[0-9])', '', content)
            
            # Removes stray $ signs floating inside UI text tags
            new_content = re.sub(r'>\s*\$\s*', '>', new_content)
            
            if content != new_content:
                with open(filepath, 'w') as f:
                    f.write(new_content)
