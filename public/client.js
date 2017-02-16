// client-side js
// run by the browser each time your view template is loaded

// by default, you've got jQuery,
// add other scripts at the bottom of index.html

$(function() {
    var data = {
        init: function() {
            //// build grid at the begining!
            this.grid = [{
                0: "",
                1: "",
                2: ""
            }, {
                0: "",
                1: "",
                2: ""
            }, {
                0: "",
                1: "",
                2: ""
            }, ];
            //winning combinations
            this.row = [["0-0", "0-1", "0-2"], ["1-0", "1-1", "1-2"], ["2-0", "2-1", "2-2"], ["0-0", "1-0", "2-0"], ["0-1", "1-1", "2-1"], ["0-2", "1-2", "2-2"], ["0-0", "1-1", "2-2"], ["0-2", "1-1", "2-0"], ];
        },
        getGrid: function() {
            return this.grid;
        },
        setGrid: function(grid) {
            this.grid = grid;
        }
    }
    var controller = {

        // initialize data and view at the begining!
        init: function() {

            data.init();
            view.init();
            this.user = {
                'symbol': '',
                lastPlay: []
            };
            this.pc = {
                'symbol': '',
                lastPlay: []
            };
            this.pcMoved = 0;
        },
        // set player side
        setPlayer: function(e) {
            this.user.symbol = (e.id).toString();
            this.pc.symbol = (e.id).toString() === 'x' ? '0' : 'x';
            this.startGame();
        },
        // start game
        startGame: function() {
            var html = this.buildGrid(this.getGrid());
            view.setScreenView(html);

            $('.grid').on('click', function(e, i) {
                if (!$(this).hasClass("checked")) {
                    controller.pcMoved = 0;
                    if (controller.availableMoves().length < 0) {} else {
                        var result = controller.updateGrid($(this).data('x'), $(this).data('y'), controller.user);
                        if (controller.availableMoves().length < 1 || result !== false) {
                            if (result !== false) {
                                view.setWinningView(result);
                            } else {
                                view.setWinningView({
                                    'note': "<h2>it's a draw!</h2>",
                                    'move': false
                                });
                            }
                        } else {
                            controller.pcMoved = 1;
                            AI.makePlay(controller.gridRef);
                            var coord = AI.getPlaysMade();
                            coord = coord.split('-');
                            var result = controller.updateGrid(coord[0], coord[1], controller.pc);
                            if (result !== false) {
                                view.setWinningView(result);
                            }
                        }
                    }
                }
            });
        },
        // build grid for table
        buildGrid: function(grid) {
            var html = '';
            var gridRef = {};
            grid.forEach(function(v, i) {
                for (var j = 0; j < Object.keys(v).length; j++) {
                    var key = Object.keys(v)[j];
                    var uid = i.toString() + '-' + j.toString();

                    //create grid reference
                    gridRef[uid] = '';
                    html += '<div class="grid" id="' + uid + '"  data-x="' + i + '" data-y="' + j + '">' + v[key] + '</div>';
                }
            });
            this.gridFormatted = gridRef;
            return html;
        },
        getGrid: function() {
            return data.getGrid();
        },
        setGrid: function(grid) {
            return data.setGrid(grid);
        },
        // make random play 
        randomChoice: function() {
            var choice = Math.ceil(Math.random() * Object.keys(this.gridFormatted).length);
            var choiceKey = Object.keys(this.gridFormatted)[choice];
            if (this.gridFormatted[choiceKey] !== "") {
                return this.randomChoice();
            }
            return Object.keys(this.gridFormatted)[choice]
        },
        
        //update grid with player move
        updateGrid: function(x, y, player) {
            var uid = x.toString() + '-' + y.toString();
            if (this.pcMoved === 0) {
                this.user.lastPlay.push(uid);
            }
            this.gridFormatted[uid] = player.symbol;

            $('#' + uid).addClass("checked")

            for (var j = 0; j < Object.keys(this.gridFormatted).length; j++) {
                var key = Object.keys(this.gridFormatted)[j];
                $('#' + key).html(this.gridFormatted[key]);
            }

            var grid = (this.getGrid());
            grid[x.toString()][y.toString()] = player.symbol;
            this.setGrid(grid);
            var result = this.checkWinStatus(player);
            return result;
        },
        //check winning status
        checkWinStatus: function(player) {
            var winner = false;
            var used = false;

            data.row.forEach(function(v, i) {
                var checksum = '';
                v.forEach(function(w, j) {
                    var grid = (controller.getGrid());
                    var coord = w.split("-");
                    checksum += (grid[coord[0]][coord[1]]);
                });
                checksum = checksum.replace(new RegExp(player.symbol,"g"), "@");
                if (checksum == '@@@') {
                    if (winner == false) {
                        if (used == false) {
                            used = true;
                            if (controller.pcMoved == 0) {
                                winner = {
                                    note: "<h2>Congrats you won!</h2>",
                                    move: v
                                };
                            } else {
                                winner = {
                                    note: "<h2>Sorry, you lost!</h2>",
                                    move: v
                                };
                            }
                        }
                    }
                }
            })
            return winner
        },
        //check available moves left
        availableMoves: function() {
            var empty = [];
            this.getGrid().forEach(function(a, i) {
                var set = {};
                for (var j = 0; j < Object.keys(a).length; j++) {
                    if (a[Object.keys(a)[j]] == '') {
                        empty.push([i, j].join('-'));
                    }
                }
                ;
            }, empty);
            return empty;
        }
    };

    // pc component 
    var AI = {
        playsMade: '',
        //get stored list of plays made
        getPlaysMade: function() {
            return this.playsMade;
        },

        //specify game coordinate to make i.e (0,1)
        makePlay: function(ref) {
            //copy ref data
            this.ref = controller.gridFormatted;
            for (var j = 0; j < Object.keys(controller.gridFormatted).length; j++) {

                var key = Object.keys(controller.gridFormatted)[j];
                var coord = (key.split("-"));
                var grid = controller.getGrid();
                grid[coord[0]][coord[1]] = controller.gridFormatted[key];
                controller.setGrid(grid);
            }
            //grid built
            this.playsMade = this.test(controller.getGrid())
        },
        //comp choice maker
        test: function(grid) {

            var empty = controller.availableMoves();
            if (empty.length > 0) {
                //no moves left

                var play = {};
                var checksum_pc = checksum_user = ''
                var choice = {
                    'blockMove': [],
                    'winningMove': [],
                    'mehMove': []
                };
                data.row.forEach(function(v, i) {
                    var checksum = '';
                    var availableMove = '';
                    v.forEach(function(w, j) {
                        var grid = (controller.getGrid());
                        var coord = w.split("-");
                        if (empty.indexOf(w) > -1) {
                            availableMove = w
                        } else
                            checksum += (grid[coord[0]][coord[1]]);
                    });
                    checksum_user = checksum.replace(new RegExp(controller.user.symbol,"g"), "@");
                    checksum_pc = checksum.replace(new RegExp(controller.pc.symbol,"g"), "@");
                    if (checksum_pc == '@@') {
                        choice.winningMove.push(availableMove);

                    } else if (checksum_user == '@@') {
                        choice.blockMove = [];
                        choice.blockMove.push(availableMove);
                    } else {
                        choice.mehMove = [];
                        choice.mehMove.push(controller.randomChoice());
                    }
                })

                if (choice.winningMove.length > 0) {
                    return ( choice.winningMove[0]) ;
                } else if (choice.blockMove.length > 0) {
                    return ( choice.blockMove[0]) ;
                } else {
                    return ( choice.mehMove[0]) ;
                }
            }
        }

    }

    var view = {
        // initialize view
        init: function() {
            this.screen = "screen";
            this.setScreenView(this.chooseSide());
            $('.side').on('click', function(e, i) {
                controller.setPlayer(this);
            })

        },
        // display grid 
        setScreenView: function(html) {
            $("#screen").html('<div class="board">' + html + '</div>');
        },
        // display winning status
        setWinningView: function(html) {
            $("#screen").prepend('<div class="notify">' + html.note + '</div><br>');
            $("#screen .grid").addClass('faded').addClass('checked');
            $("#screen").prepend('<div class="notify">Reseting...<img width="16px" src="https://cdn.gomix.com/7f275fa4-60d4-4c02-8703-0055142dfd8e%2Floading.gif"></div><br>');
            var test = setTimeout(function() {
                controller.init();
            }, 3000)
            if (html.move) {
                html.move.forEach(function(v, i) {
                    $('#' + v).addClass('win');
                });
            }

        },
        // pick choice
        chooseSide: function() {
            return '<div class=welcome>' + '<div class="chooseside">' + '<p>Pick a side</p>' + '<div id="x" class="side"> X </div>' + '<div id="0" class="side"> 0 </div>' + '<\div>' + '<\div>';
        }
    }
    controller.init();
});
