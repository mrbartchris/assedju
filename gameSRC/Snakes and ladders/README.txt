*** BUGS in Multiplayer version:

	1. Two chances to play instead of one chance is given to each player when it's his turn to play.

	2. When the game is won and the page is reloaded, the socketCounter is not incremented, and thus 
	   the nextMove button is not activated/deactivated as it should be. This leads to 
  	   both instances of the game having the nextMove button deactivated and not being 
   	   able to play.

*** Areas of Improvement:

	1. Only two boxes are painted at a time (one per each player). A way to remove the previously
      	   painted boxes needs to be found. 

*** Single Player version is just a version in which you keep on pressing the 'nextMove' button until you
    win. It's not actually a game where you play against the computer. 