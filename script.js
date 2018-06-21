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

  let htmlDoc,
      $templateArea = $('#templateArea');

  $templateArea.load('./resources/order-template.html');

  fs.readFile('resources/order-template.html', function (err, html) {
    if (err) {
      throw err;
    }
    htmlDoc = html;
  });


  $('#excelLoad').click(function () {
    if (!gridData) {
      alert('주문 파일을 먼저 선택하세요.');
      return;
    }

    let rawData = [];
    for (let i = 0; i < gridData.length; i++) {
      let templateCode = gridData[i].TEMPLATE_CODE.split('_');
      let epsDesignCode = gridData[i].EPS_DESIGN_CODE.split('_');
      let data = {
        shop: gridData[i].REQUEST,
        template: templateCode[0],
        device: templateCode[1],
        designCode: epsDesignCode[0],
        designSubCode: gridData[i].DESIGN_SUB_CODE,
        quantity: parseInt(gridData[i].QUANTITY)
      };
      rawData[i] = data;
    }

    // 정렬
    rawData = rawData.sort(function (a, b) {
      if (a.shop === b.shop) {
        if (a.template === b.template) {
          if (a.device === b.device) {
            if (a.designCode === b.designCode) {
              return 0;
            } else if (a.designCode < b.designCode) {
              return -1;
            } else {
              return 1;
            }
          } else if (a.device < b.device) {
            return -1;
          } else {
            return 1;
          }
        } else if (a.template < b.template) {
          return -1;
        } else {
          return 1;
        }
      } else if (a.shop < b.shop) {
        return -1;
      } else {
        return 1;
      }
    });

    //console.log('rawData='+JSON.stringify( rawData ));



    // let model1 = {
    //   template: 'BLACK',
    //   orders: [{
    //     device: 'IP6',
    //     designs: [{
    //       code: 'A0001',
    //       sub: [
    //         {subCode: 'white', qty: 1},
    //         {subCode: 'red', qty: 5}
    //       ]
    //     }]
    //   }]
    // };

    let modelMap = new Map();
    // modelMap.set(gridData[i].REQUEST, model);

    // 발주서용 데이터 구조화
    let orderPaperDataMap = createOrderPaperData(rawData);

    setOrderPaperOrderRow(orderPaperDataMap);

    // 상세 주문내역용 데이터 구조화
    let orderDetailDataMap = createOrderDetailData(rawData);
    setOrderDetailTemplateTab(orderDetailDataMap);



    $templateArea.show();


	  fs.writeFile('C:/주문서22.html', $templateArea.html(), 'utf8', function (err) {
		  if (err) {
			  throw err;
		  }
		  console.log('write ok')
	  });
  });
});

/**
 * 템플릿별로 그룹핑하여 주문 목록 생성
 * @param rawData
 * @returns {Map}
 */
var createOrderPaperData = function (rawData) {
  let templateMap = new Map();
  for (let i = 0; i < rawData.length; i++) {
    if (templateMap.has(rawData[i].template)) {
      continue;
    }
    templateMap.set(rawData[i].template, []);
  }

  templateMap.forEach((value, key, map) => {
    console.log(`key=${key}`);

    // 현재 key에 해당하는 템플릿만 추출
    let filteredRawData = rawData.filter(function (data) {
      return data.template === key;
    });

    // 주문 목록 생성
    let orderPaperData = [];
    for (let key in filteredRawData) {
      let data = filteredRawData[key];
      //console.log('filteredRawData['+key+']='+JSON.stringify(data));

      // 이미 존재하면 수량 증가
      let isExist = orderPaperData.some(function (element) {
        if (element.device === data.device) {
          element.quantity += data.quantity;
          return true;
        }
      });

      // 없는것이면 신규 생성
      if (!isExist) {
        orderPaperData.push({
          template: data.template,
          device: data.device,
          quantity: data.quantity
        });
      }
    }
    console.log(`orderPaperData.length=${orderPaperData.length}`);
    templateMap.set(key, orderPaperData);
  });

  return templateMap;
};

/**
 * 발주서 내 주문 목록 셋팅
 * @param orderPaperDataMap
 */
var setOrderPaperOrderRow = function (orderPaperDataMap) {
  let $row = $('#order-list');

  orderPaperDataMap.forEach((value, key, map) => {
    console.log(`orderPaperDataMap.get(${key})=${JSON.stringify(orderPaperDataMap.get(key))}`);

    let v = orderPaperDataMap.get(key)[0];
    let firstRow = `
      <tr>
        <td rowspan="${value.length}">${templates.get(v.template)}</td>
        <td></td>
        <td><a href="#${v.template.toLowerCase()}-${v.device.toLowerCase()}">${devices.get(v.device)}</a></td>
        <td class="text-right">${v.quantity}</td>
        <td></td>
      </tr>`;
    $row.append(firstRow);

    for (let i = 1; i < orderPaperDataMap.get(key).length; i++) {
      v = orderPaperDataMap.get(key)[i];
      let otherRow = `
      <tr>
        <td></td>
        <td><a href="#${v.template.toLowerCase()}-${v.device.toLowerCase()}">${devices.get(v.device)}</a></td>
        <td class="text-right">${v.quantity}</td>
        <td></td>
      </tr>`;
      $row.append(otherRow);
    }

  });
};

/**
 * 상세 주문내역용 데이터 구조화하여 상세 목록 생성
 * @param rawData
 * @returns {Map}
 */
var createOrderDetailData = function (rawData) {
  let templateMap = new Map();
  for (let i = 0; i < rawData.length; i++) {
    if (templateMap.has(rawData[i].template)) {
      continue;
    }
    templateMap.set(rawData[i].template, []);
  }

  templateMap.forEach((value, key, map) => {
    console.log(`key=${key}`);

    // 현재 key에 해당하는 템플릿만 추출
    templateMap.set(key, rawData.filter(function (data) {
      return data.template === key;
    }));
  });

  return templateMap;
};

var setOrderDetailTemplateTab = function (orderDetailDataMap) {
  // 좌측 탭메뉴에 템플릿 추가
  let $leftMenu = $('#left-menu');
  orderDetailDataMap.forEach((value, key, map) => {
    let menuItem = `<li><a href="#tabs-${key.toLowerCase()}">${templates.get(key)}</a></li>`;
    console.log(`menuItem=${menuItem}`);
    $leftMenu.append(menuItem);
  });

  let $tabs = $('#tabs-left');
  orderDetailDataMap.forEach((value, key, map) => {
    let tabHtml = `
      <div id="tabs-${key.toLowerCase()}" class="template-tab">
        <div>
          <table id="black-ip5">
            <colgroup>
              <col style="width: 10%">
              <col style="width: 10%">
              <col style="width: 10%">
              <col style="width: 10%">
              <col style="width: 10%">
              <col style="width: 10%">
              <col style="width: 10%">
              <col style="width: 10%">
              <col style="width: 10%">
              <col style="width: 10%">
            </colgroup>
            <thead>
              <tr>
                <th colspan="10" class="text-red">iPhone 5 ${templates.get(key)}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><img src="http://webagency.pe.kr/thumbnail/A0001_SOFTT_1.jpg" class="thumbnail"></td>
                <td><img src="http://webagency.pe.kr/thumbnail/A0001_SOFTT_2.jpg" class="thumbnail"></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
              <tr class="qty">
                <td>1</td>
                <td>1</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            </tbody>
          </table>
          <button type="button" name="templatePrint">인쇄</button>
        </div>
      </div>`;
    $tabs.append(tabHtml);
  });
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
