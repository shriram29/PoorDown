# PoorDown — Game Mechanics

Standard Monopoly rules. All deviations from standard rules are called out explicitly.

---

## Board

40 spaces, clockwise from GO (index 0).

### Space Types

| Type | Count | Description |
|------|-------|-------------|
| `go` | 1 | Collect $200 on pass or land |
| `property` | 22 | Buyable colored properties |
| `railroad` | 4 | Buyable railroads |
| `utility` | 2 | Electric Company, Water Works |
| `tax` | 2 | Income Tax ($200), Luxury Tax ($100) |
| `chance` | 3 | Draw Chance card |
| `communityChest` | 3 | Draw Community Chest card |
| `jail` | 1 | Space 10 — Just Visiting if not in jail |
| `goToJail` | 1 | Space 30 — Sends player to jail |
| `freeParking` | 1 | Space 20 — No effect (jackpot optional) |

### Full Board (index → space)

| # | Name | Type | Group | Price | Rent (0/1/2/3/4/hotel) | House $ |
|---|------|------|-------|-------|------------------------|---------|
| 0 | GO | go | — | — | — | — |
| 1 | Mediterranean Ave | property | brown | 60 | 2/10/30/90/160/250 | 50 |
| 2 | Community Chest | communityChest | — | — | — | — |
| 3 | Baltic Ave | property | brown | 60 | 4/20/60/180/320/450 | 50 |
| 4 | Income Tax | tax | — | — | Pay $200 | — |
| 5 | Reading Railroad | railroad | railroad | 200 | 25/50/100/200 | — |
| 6 | Oriental Ave | property | lightBlue | 100 | 6/30/90/270/400/550 | 50 |
| 7 | Chance | chance | — | — | — | — |
| 8 | Vermont Ave | property | lightBlue | 100 | 6/30/90/270/400/550 | 50 |
| 9 | Connecticut Ave | property | lightBlue | 120 | 8/40/100/300/450/600 | 50 |
| 10 | Jail / Just Visiting | jail | — | — | — | — |
| 11 | St. Charles Place | property | pink | 140 | 10/50/150/450/625/750 | 100 |
| 12 | Electric Company | utility | utility | 150 | 4x/10x dice | — |
| 13 | States Ave | property | pink | 140 | 10/50/150/450/625/750 | 100 |
| 14 | Virginia Ave | property | pink | 160 | 12/60/180/500/700/900 | 100 |
| 15 | Pennsylvania Railroad | railroad | railroad | 200 | 25/50/100/200 | — |
| 16 | St. James Place | property | orange | 180 | 14/70/200/550/750/950 | 100 |
| 17 | Community Chest | communityChest | — | — | — | — |
| 18 | Tennessee Ave | property | orange | 180 | 14/70/200/550/750/950 | 100 |
| 19 | New York Ave | property | orange | 200 | 16/80/220/600/800/1000 | 100 |
| 20 | Free Parking | freeParking | — | — | No effect | — |
| 21 | Kentucky Ave | property | red | 220 | 18/90/250/700/875/1050 | 150 |
| 22 | Chance | chance | — | — | — | — |
| 23 | Indiana Ave | property | red | 220 | 18/90/250/700/875/1050 | 150 |
| 24 | Illinois Ave | property | red | 240 | 20/100/300/750/925/1100 | 150 |
| 25 | B&O Railroad | railroad | railroad | 200 | 25/50/100/200 | — |
| 26 | Atlantic Ave | property | yellow | 260 | 22/110/330/800/975/1150 | 150 |
| 27 | Ventnor Ave | property | yellow | 260 | 22/110/330/800/975/1150 | 150 |
| 28 | Water Works | utility | utility | 150 | 4x/10x dice | — |
| 29 | Marvin Gardens | property | yellow | 280 | 24/120/360/850/1025/1200 | 150 |
| 30 | Go To Jail | goToJail | — | — | — | — |
| 31 | Pacific Ave | property | green | 300 | 26/130/390/900/1100/1275 | 200 |
| 32 | North Carolina Ave | property | green | 300 | 26/130/390/900/1100/1275 | 200 |
| 33 | Community Chest | communityChest | — | — | — | — |
| 34 | Pennsylvania Ave | property | green | 320 | 28/150/450/1000/1200/1400 | 200 |
| 35 | Short Line Railroad | railroad | railroad | 200 | 25/50/100/200 | — |
| 36 | Chance | chance | — | — | — | — |
| 37 | Park Place | property | darkBlue | 350 | 35/175/500/1100/1300/1500 | 200 |
| 38 | Luxury Tax | tax | — | — | Pay $100 | — |
| 39 | Boardwalk | property | darkBlue | 400 | 50/200/600/1400/1600/1750 | 200 |

---

## Rent Rules

### Properties
- Base rent = `space.rent[0]` (no houses)
- With houses: `space.rent[houses]` (index 1–4)
- Hotel (5): `space.rent[5]`
- If owner has full color set and no houses on property: rent is doubled (`space.rent[0] * 2`)
- Mortgaged property: no rent

### Railroads
- 1 railroad owned: $25
- 2 railroads owned: $50
- 3 railroads owned: $100
- 4 railroads owned: $200

### Utilities
- 1 utility owned: dice roll × 4
- 2 utilities owned: dice roll × 10

---

## Jail

### Going to jail
- Land on "Go To Jail" (space 30)
- Draw a "Go to Jail" Chance/Community Chest card
- Roll doubles 3 times in a row

### In jail options (each turn)
1. Pay $50 fine → roll and move normally
2. Use "Get Out of Jail Free" card → roll and move normally
3. Roll doubles → move that many spaces (don't roll again)
4. After 3 turns in jail: must pay $50 and move

### Just visiting
Landing on space 10 without being sent to jail = no effect.

---

## Houses and Hotels

- Must own all properties in a color group to build
- Houses must be built uniformly: no property can have more than 1 house above the others
- Max 4 houses per property
- 4 houses → sell all 4 and place 1 hotel (represented as houses = 5)
- Sell houses at half price (`housePrice / 2`)
- Must sell all houses on a color group before mortgaging any property in that group

---

## Mortgage

- Mortgage value: `Math.floor(price / 2)`
- Unmortgage cost: `Math.floor(price / 2 * 1.1)` (10% interest)
- Mortgaged properties collect no rent
- Can still be traded while mortgaged (new owner must pay 10% interest to unmortgage)

---

## Bankruptcy

A player is bankrupt when they cannot pay a debt (rent, tax, fine) even after:
- Selling all houses/hotels (at half price)
- Mortgaging all properties
- Trading with other players

**When bankrupt:**
- If owed to the bank: all assets return to bank (properties become unowned, available for purchase again)
- If owed to a player: all assets transfer to that player (mortgaged properties transfer; receiving player must decide to unmortgage or keep mortgaged)
- Player is eliminated from game

---

## Win Condition

Last player not bankrupt wins. When `activePlayers.length === 1`, set `meta.set('gameOver', true)` and `meta.set('winner', player.name)`.

---

## Doubles

- Roll doubles → take turn normally, then roll again
- Roll doubles twice → roll again
- Roll doubles three times in a row → go to jail immediately (no move on third roll)

---

## Card Decks

### Chance (16 cards)
1. Advance to GO (collect $200)
2. Advance to Illinois Ave — if you pass GO, collect $200
3. Advance to St. Charles Place — if you pass GO, collect $200
4. Advance to nearest utility — if unowned, buy it; if owned, pay 10× dice
5. Advance to nearest railroad — if unowned, buy it; if owned, pay 2× rent
6. Advance to nearest railroad (same as above — appears twice)
7. Bank pays you dividend of $50
8. Get Out of Jail Free (keep card)
9. Go Back 3 Spaces
10. Go to Jail — go directly to jail
11. Make general repairs: pay $25/house, $100/hotel
12. Pay poor tax of $15
13. Take a trip to Reading Railroad — if you pass GO, collect $200
14. Take a walk on the Boardwalk — advance to Boardwalk
15. You have been elected chairman: pay each player $50
16. Your building and loan matures — collect $150

### Community Chest (16 cards)
1. Advance to GO (collect $200)
2. Bank error in your favor — collect $200
3. Doctor's fee — pay $50
4. From sale of stock you get $50
5. Get Out of Jail Free (keep card)
6. Go to Jail — go directly to jail
7. Grand Opera Night — collect $50 from every player
8. Holiday Fund matures — receive $100
9. Income tax refund — collect $20
10. It is your birthday — collect $10 from every player
11. Life insurance matures — collect $100
12. Pay hospital fees of $100
13. Pay school fees of $150
14. Receive $25 consultancy fee
15. You are assessed for street repairs: pay $40/house, $115/hotel
16. You have won second prize in a beauty contest — collect $10

---

## Configurable Rules (Pre-game)

| Setting | Default | Options |
|---------|---------|---------|
| Starting cash | $1500 | $1000 / $1500 / $2000 / $3000 |
| Auction on decline | On | On / Off |
| Mortgage | Enabled | Enabled / Disabled |
| Free Parking jackpot | Off | Off / $100 seed / Taxes go to pot |
| Max players | 8 | 2–8 |

---

## Passing GO

Collect $200 any time you pass over or land on GO. No bonus for landing directly on GO (standard rules).

---

## Trading

Players may trade:
- Cash
- Properties (mortgaged or unmortgaged)
- Get Out of Jail Free cards

Trades require both players to confirm. Trades can happen on any player's turn (not just the active player's). No free cash-only gifts allowed (must include at least one property or card from each side — *this is a house rule decision, TBD*).
