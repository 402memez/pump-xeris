with open('src/components/RocketGame.jsx', 'r') as f:
    code = f.read()

# Strip the conflicting CSS transition delays from the rocket container
code = code.replace('className="absolute transition-all duration-75 ease-out z-20"', 'className="absolute z-20"')

with open('src/components/RocketGame.jsx', 'w') as f:
    f.write(code)
