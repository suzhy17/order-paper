const fs = require('fs');
//var handsontable = require('handsontable');
XLSX = require('xlsx');


var gridData = [];

$(document).ready(function () {
  'use strict';

  console.log('__dirname='+__dirname);

  let htmlText = '';

  fs.readFile('resources/order-template.html', function (err, html) {
    if (err) {
      throw err;
    }
    htmlText = html;
    console.log('html ==> \m' + htmlText);
  });


  $('#excelLoad').click(function () {
    if (!gridData) {
      alert('주문 파일을 먼저 선택하세요.');
      return;
    }

    for (var i = 0; i < gridData.length; i++) {
        if (!gridData[i].EPS_DESIGN_CODE) {
            break;
        }
        console.log(gridData[i]);
    }

	  fs.writeFile('C:/주문서22.html', htmlText, 'utf8', function (err) {
		  if (err) {
			  throw err;
		  }
		  console.log('write end')
	  });
  });
});


const htModule = (function () {
  const settings = {
    container: document.getElementById('grid'),
    $xlf: $('#xlf')
  };

  const handsonTable = new Handsontable(settings.container, {
    data: gridData,
    // dataSchema: {
    //     epsDesignCode: null,
    //     templateCode: null,
    //     designSubCode: null,
    //     quantity: null,
    //     request: null
    // },
    search: true,
    // startRows: 0,
    // startCols: 2,
    width: 850,
    height: 395,
    colWidths: [200, 150, 140, 140, 150],
    manualColumnResize: true,
    rowHeights: 25,
    rowHeaders: true,
    colHeaders: ['EPS_DESIGN_CODE', 'TEMPLATE_CODE', 'DESIGN_SUB_CODE', 'QUANTITY', 'REQUEST'],
    columns: [
      {data: 'EPS_DESIGN_CODE'},
      {data: 'TEMPLATE_CODE'},
      {data: 'DESIGN_SUB_CODE'},
      {data: 'QUANTITY'},
      {data: 'REQUEST'}
    ],
    minSpareRows: 10000,
    maxRows: 10000
  });

  const bind = function () {

    settings.$xlf.change(function (event) {
      handleFile(event, function (json) {
        // var str = JSON.stringify(json, null, 2);
        // console.log('str='+str);
        const firstKey = Object.keys(json)[0];
        gridData = json[firstKey];
        refresh();
      });
    });

  };

  const init = function () {

    bind();

  };

  /**
   * 그리드 새로고침 (gridData 로드)
   */
  const refresh = function () {
    handsonTable.loadData(gridData);
  };

  return {
    init: init
  }
})();

$(function () {
    htModule.init();
});
