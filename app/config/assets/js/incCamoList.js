/**
 * Responsible for rendering the select region screen 
 */
'use strict';

var households, masterFamList, bairro, tabz, zone, houseGroup;
function display() {
    console.log("TABZ list loading");
    bairro = util.getQueryParameter('bairro');
    tabz = util.getQueryParameter('tabz');
    zone = util.getQueryParameter('zone');
    houseGroup = util.getQueryParameter('houseGroup');
    
    var head = $('#main');
    head.prepend("<h1>" + tabz + " - " + houseGroup + " </br> <h3> Camo");
    
    doSanityCheck();
    getList();
}

function doSanityCheck() {
    console.log("Checking things");
    console.log(odkData);
}

// Get tabz from CSV
$.ajax({
    url: 'masterFamList.csv',
    dataType: 'text',
}).done(getMasterList);

function getMasterList(data) {
    masterFamList = [];
    var allRows = data.split(/\r?\n|\r/);
    for (var row = 1; row < allRows.length; row++) {  // start at row = 1 to skip header
            allRows[row] = allRows[row].replace(/"/g,""); // remove quotes from strings
            var rowValues = allRows[row].split(",");
            var p = {bairro: rowValues[0], tabz: rowValues[1], zone: rowValues[2], houseGroup: rowValues[3], camo: rowValues[4], fam: rowValues[5], famName: rowValues[6]};
            masterFamList.push(p);
    }
}

function getList() {
    // SQL to get households
    var varNames = "_savepoint_type, CAMO, HOUSEGRP, TABZ, VISITA";
    var sql = "SELECT " + varNames +
        " FROM MASKHOUSEHOLD " + 
        " WHERE TABZ = " + tabz + " AND HOUSEGRP = '" + houseGroup + "' "
    households = [];
    console.log("Querying database for households...");
    console.log(sql);
    var successFn = function( result ) {
        console.log("Found " + result.getCount() + " households");
        for (var row = 0; row < result.getCount(); row++) {
            var savepoint = result.getData(row,"_savepoint_type");

            var CAMO = result.getData(row,"CAMO");
            var HOUSEGRP = result.getData(row,"HOUSEGRP");
            var TABZ = result.getData(row,"TABZ");
            var VISITA = result.getData(row,"VISITA")

            var p = { type: 'household', savepoint, CAMO, HOUSEGRP, TABZ, VISITA};
            households.push(p);
        }
        console.log("households:", households)
        initButtons();
        return;
    }
    var failureFn = function( errorMsg ) {
        console.error('Failed to get households from database: ' + errorMsg);
        console.error('Trying to execute the following SQL:');
        console.error(sql);
        alert("Program error Unable to look up persons.");
    }
    odkData.arbitraryQuery('MASKHOUSEHOLD', sql, null, null, null, successFn, failureFn);
}

function initButtons() {
    // Zone buttons
    var ul = $('#li');
    console.log("initB",masterFamList);

    const listFromMaster = [];
    const map = new Map();
    for (const item of masterFamList) {
        if (item.bairro == bairro & item.tabz == tabz & item.houseGroup == houseGroup) {
            if(!map.has(item.camo)){
                map.set(item.camo, true);    // set any value to Map
                listFromMaster.push({
                    bairro: item.bairro,
                    tabz: item.tabz,
                    zone: item.zone,
                    houseGroup: item.houseGroup,
                    camo: item.camo
                });
            }
        }
    }

    console.log("test", listFromMaster);

    $.each(listFromMaster, function() {
        var that = this;
        // list
        ul.append($("<li />").append($("<button />").attr('id',this.camo).attr('class','btn' + this.bairro).append(this.camo).append(" " + getCount(this.camo))));
        
        
        // Buttons
        var btn = ul.find('#' + this.camo);
        btn.on("click", function() {
            var queryParams = util.setQuerystringParams(null, that.bairro, that.tabz, that.zone, that.houseGroup, that.camo);
            odkTables.launchHTML(null, 'config/assets/incFamList.html' + queryParams);
        })        
    });
}

function getCount(camo) {
    var total = households.filter(household => household.TABZ == tabz & household.HOUSEGRP == houseGroup & household.CAMO == camo).length;
    var visited = households.filter(household => household.TABZ == tabz & household.HOUSEGRP == houseGroup & household.CAMO == camo & household.VISITA != null & household.savepoint == "COMPLETE").length;
    var count = "(" + visited + "/" + total + ")";
    return count;
}

function titleCase(str) {
    if (!str) return str;
    return str.toLowerCase().split(' ').map(function(word) {
      return (word.charAt(0).toUpperCase() + word.slice(1));
    }).join(' ');
  }