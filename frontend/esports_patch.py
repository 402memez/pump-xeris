with open('src/components/RocketGame.jsx', 'r') as f:
    code = f.read()

# 1. Force Hardware Acceleration (GPU Layering)
old_transform = 'transform: `translate(-50%, -50%) rotate(${rocketRotation}deg)`,'
new_transform = 'transform: `translate(-50%, -50%) rotate(${rocketRotation}deg) translateZ(0)`, willChange: "transform, left, top",'
code = code.replace(old_transform, new_transform)

# 2. Kill the Canvas CPU Killer (shadowBlur)
code = code.replace('ctx.shadowBlur = 20;', 'ctx.shadowBlur = 0; // GPU Hack')

# 3. Kill the SVG Filter CPU Killer
old_filter = 'filter: "drop-shadow(0 0 20px rgba(52, 211, 153, 1)) drop-shadow(0 0 40px rgba(6, 182, 212, 0.6))",'
code = code.replace(old_filter, '')

with open('src/components/RocketGame.jsx', 'w') as f:
    f.write(code)
