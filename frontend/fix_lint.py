with open('src/pages/RocketGamePage.jsx', 'r') as f:
    code = f.read()

# Put handleCashOut back into the dependency array so Railway's strict linter passes it
code = code.replace('}, [fetchGameHistory, fetchLeaderboard]);', '}, [fetchGameHistory, fetchLeaderboard, handleCashOut]);')

with open('src/pages/RocketGamePage.jsx', 'w') as f:
    f.write(code)
