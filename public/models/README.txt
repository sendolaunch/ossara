PUT 3D MODEL FILES HERE.

The game looks for character models in this folder. Right now it wants:

    hero.glb     <- your Warden character

If the file isn't here, the game just uses the placeholder shape — nothing
breaks. Drop hero.glb in, refresh the browser, and the Warden becomes a real
3D character.

All models here should be CC0 / free-for-commercial-use (e.g. Quaternius).
Filenames and scale are configured in: src/config/models.js
