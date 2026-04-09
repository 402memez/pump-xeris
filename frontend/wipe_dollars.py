with open('src/components/BettingPanel.jsx', 'r') as f:
    code = f.read()

# 1. Destroy the Lucide React DollarSign icon on the balance
code = code.replace('<DollarSign className="w-7 h-7" />', '')
code = code.replace('{balance.toLocaleString()}', '{balance.toLocaleString()} <span className="text-xl text-cyan-300 ml-2">XRS</span>')

# 2. Swap the DollarSign icon inside the Input box for XRS text
old_input = '<DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />'
new_input = '<span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm font-bold text-gray-500">XRS</span>'
code = code.replace(old_input, new_input)
# Fix input padding so text stays centered perfectly
code = code.replace('className="pl-10 bg-gray-800', 'className="px-12 bg-gray-800')

# 3. Destroy the sneaky JSX literal dollar signs
code = code.replace('CASH OUT ${(activeBet.betAmount * activeBet.currentMultiplier).toFixed(2)}', 'CASH OUT {(activeBet.betAmount * activeBet.currentMultiplier).toFixed(2)} XRS')
code = code.replace('Bet: ${activeBet.betAmount} × {activeBet.currentMultiplier.toFixed(2)}x', 'Bet: {activeBet.betAmount} XRS × {activeBet.currentMultiplier.toFixed(2)}x')

# 4. Fix the literal toast notification
code = code.replace('Bet placed: $${betAmount}', 'Bet placed: ${betAmount} XRS')

with open('src/components/BettingPanel.jsx', 'w') as f:
    f.write(code)
