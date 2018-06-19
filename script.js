'use strict';

const fs = require('fs');
XLSX = require('xlsx');

const templates = new Map([
  ['BLACK' , '블랙케이스'],
  ['SPRIT' , '스피릿케이스'],
  ['SOFTT' , '소프트케이스'],
  ['TWINK' , '트윙클케이스']
]);

const devices = new Map();
devices.set('IP5', '아이폰5');
devices.set('IP6', '아이폰6');
devices.set('IP7', '아이폰7');
devices.set('IP7P', '아이폰7+');
devices.set('IP8', '아이폰8');
devices.set('IP8P', '아이폰8+');
devices.set('IPFX', '아이폰X');
devices.set('GS7', '갤럭시S7');
devices.set('GS7P', '갤럭시S7+');
devices.set('GS8', '갤럭시S8');
devices.set('GS8P', '갤럭시S8+');
devices.set('GS9', '갤럭시S9');
devices.set('GS9P', '갤럭시S9+');
devices.set('GN5', '갤럭시노트5');
devices.set('GN6', '갤럭시노트6');
devices.set('GN7', '갤럭시노트7');
devices.set('GN8', '갤럭시노트8');

let gridData = [];


$(document).ready(function () {

  console.log('__dirname='+__dirname);

  let htmlDoc;

  $('#template').load('./resources/order-template.html #tabs-oderlist', function () {
  });

  fs.readFile('resources/order-template.html', function (err, html) {
    if (err) {
      throw err;
    }
    htmlDoc = html;
    console.log('htmlDoc ==> ' + htmlDoc);
  });


  $('#excelLoad').click(function () {
    if (!gridData) {
      alert('주문 파일을 먼저 선택하세요.');
      return;
    }

    // gridData.some(function(data) {
    //   console.log(data);
    //   return (!data.EPS_DESIGN_CODE);
    // });
    let rawData = [];
    for (let i = 0; i < gridData.length; i++) {
      let templateCode = gridData[i].TEMPLATE_CODE.split('_');
      let epsDesignCode = gridData[i].EPS_DESIGN_CODE.split('_');
      let data = {
        template: templateCode[0],
        device: templateCode[1],
        designCode: epsDesignCode[0],
        designSubCode: gridData[i].DESIGN_SUB_CODE,
        quantity: gridData[i].QUANTITY
      };
      rawData[i] = data;
    }

    appendOrderRow(rawData);

    $('#template').show();


	  fs.writeFile('C:/주문서22.html', htmlDoc, 'utf8', function (err) {
		  if (err) {
			  throw err;
		  }
		  console.log('write end')
	  });
  });
});

var appendOrderRow = function (rawData) {
  console.log("rawData.length=" + rawData.length);
  let $row = $('#order-list');

  let v = rawData[0];
  let tr = '<tr><td rowspan="' + rawData.length + '">' + templates.get(v.template) + '</td>';
  tr += '<td></td>';
  tr += '<td><a href="#black-ip6">'+ devices.get(v.device) +'</a></td>';
  tr += '<td class="text-right">'+ v.quantity +'</td>';
  tr += '<td></td>';
  tr += '</tr>';
  $row.append(tr);

  for (let i = 1; i < rawData.length; i++) {
    v = rawData[i];
    tr = '<tr>';
    tr += '<td></td>';
    tr += '<td><a href="#black-ip6">'+ devices.get(v.device) +'</a></td>';
    tr += '<td class="text-right">'+ v.quantity +'</td>';
    tr += '<td></td>';
    tr += '</tr>';
    $row.append(tr);
  }
};


var htModule = (function () {
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
    // minSpareRows: 10000,
    maxRows: 10000
  });

  var bind = function () {

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

  var init = function () {
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
