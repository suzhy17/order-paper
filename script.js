'use strict';

const fs = require('fs');
XLSX = require('xlsx');

const thumbnailRoot = 'C:/thumbnail';

const templates = new Map([
  ['SOFTT'     , {type: 'case', label: '소프트케이스'        , price: 5500}],
  ['BLACK'     , {type: 'case', label: '블랙케이스'          , price: 7700}],
  ['TWINK'     , {type: 'case', label: '트윙클케이스'        , price: 8800}],
  ['LEATH'     , {type: 'case', label: '레더케이스'          , price: 8800}],
  ['SPRIT'     , {type: 'case', label: '스피릿케이스'        , price: 9350}],
  ['SPRITSP'   , {type: 'case', label: '스피릿케이스(커버)'  , price: 4400}],
  ['BTTRY_5CA' , {type: 'acce', label: '보조배터리 5,000mAh' , price: 12100}],
  ['BTTRY_10CA', {type: 'acce', label: '보조배터리 10,000mAh', price: 18700}],
  ['COILL'     , {type: 'acce', label: '코일룩'              , price: 4400}],
  ['SMART'     , {type: 'acce', label: '스마트클리너'        , price: 1650}],
  ['a'         , {type: 'acce', label: '강화유리'            , price: 2200}],
  ['b'         , {type: 'acce', label: '풀커버'              , price: 6600}],
  ['c'         , {type: 'acce', label: '전면부착풀커버'      , price: 13200}],
  ['d'         , {type: 'acce', label: '아이폰젠더'          , price: 550}],
  ['e'         , {type: 'acce', label: '애플케이블 핑크'     , price: 3300}],
  ['f'         , {type: 'acce', label: '애플케이블 실버'     , price: 3300}],
  ['g'         , {type: 'acce', label: '접이식LED'           , price: 6600}],
  ['h'         , {type: 'acce', label: '곰토끼LED'           , price: 4620}],
  ['i'         , {type: 'acce', label: '원형LED'             , price: 5500}],
]);

const devices = new Map([
  ['IP5', '아이폰5'],
  ['IP6', '아이폰6'],
  ['IP7', '아이폰7'],
  ['IP8', '아이폰8'],
  ['IP7P', '아이폰7플러스'],
  ['IP8P', '아이폰8플러스'],
  ['IPX', '아이폰X'],
  ['GS6', '갤럭시S6'],
  ['GS6E', '갤럭시S6엣지'],
  ['GS7', '갤럭시S7'],
  ['GS7E', '갤럭시S7엣지'],
  ['GS8', '갤럭시S8'],
  ['GS8P', '갤럭시S8플러스'],
  ['GS9', '갤럭시S9'],
  ['GS9P', '갤럭시S9플러스'],
  ['GN5', '갤럭시노트5'],
  ['GN7', '갤럭시노트7/FE'],
  ['GN8', '갤럭시노트8'],
  ['OG5', '옵티머스G5'],
  ['OG6', '옵티머스G6'],
  ['OG7', '옵티머스G7'],
]);

let gridData = [];

let groupBy = function(xs, key) {
  return xs.reduce(function(rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
};

/**
 * 썸네일 페이지용 데이터 구조화하여 상세 목록 생성
 * @param rawData
 * @returns {Map}
 */
let createThumbnailData = (rawData) => {
  console.log('=== createThumbnailData ===');
  let templateMap = new Map();
  for (let i = 0; i < rawData.length; i++) {
    if (templateMap.has(rawData[i].template)) {
      continue;
    }
    templateMap.set(rawData[i].template, []);
  }

  templateMap.forEach((value, key, map) => {
    // 현재 key에 해당하는 템플릿만 추출
    let filteredList = rawData.filter((data) => data.template === key);
    let groupByDevice = groupBy(filteredList, 'device');
    console.log(`groupByDevice=${JSON.stringify(groupByDevice)}`);

    // groupByDevice['IP6'].forEach((vo) => console.log(`${vo.template}, ${vo.device}, ${vo.designCode}, ${vo.designSubCode}`));

    for (let deviceKey in groupByDevice){
      console.log(`==> ${deviceKey}`);
      // groupByDevice[deviceKey].
    }

    templateMap.set(key, groupByDevice);
  });

  return templateMap;
};

$(document).ready(function () {

  let $templateArea = $('#templateArea');


  $('#create').click(() => {
    if (!gridData) {
      alert('주문 파일을 먼저 선택하세요.');
      return;
    }

    $templateArea.load('./resources/order-template.html', parseData);
  });

  var parseData = function () {

    // 입력 데이터 파싱
    let inputDatas = [];
    for (let i = 0; i < gridData.length; i++) {
      let templateCode = gridData[i].TEMPLATE_CODE.split('_');
      let epsDesignCode = gridData[i].EPS_DESIGN_CODE.split('_');
      inputDatas[i] = {
        shop: gridData[i].REQUEST,
        template: templateCode[0],
        device: templateCode[1],
        designCode: epsDesignCode[0],
        designSubCode: gridData[i].DESIGN_SUB_CODE,
        quantity: parseInt(gridData[i].QUANTITY)
      };
    }

    // 중복 제거 (수량만 합치기)
    let rawData = [];
    inputDatas.reduce(function (res, value) {
      let resKey = value.shop + value.template + value.device + value.designCode + value.designSubCode;
      if (!res[resKey]) {
        res[resKey] = {
          shop: value.shop,
          template: value.template,
          device: value.device,
          designCode: value.designCode,
          designSubCode: value.designSubCode,
          quantity: 0,
        };
        rawData.push(res[resKey]);
      }
      res[resKey].quantity += value.quantity;
      return res;
    }, {});


    // 정렬
    rawData = rawData.sort((a, b) => {
      if (a.shop === b.shop) {
        if (a.template === b.template) {
          if (a.device === b.device) {
            if (a.designCode === b.designCode) {
              if (a.designSubCode === b.designSubCode) {
                return 0;
              } else if (a.designSubCode < b.designSubCode) {
                return -1;
              } else {
                return 1;
              }
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


    $('#shop').text(rawData[0].shop);

    let total = {
      caseQty: 0,
      acceQty: 0,
      totalPrice: 0
    };
    for (let i = 0; i < rawData.length; i++) {
      let platform = templates.get(rawData[i].template);
      if (platform.type === 'case') {
        total.caseQty += parseInt(rawData[i].quantity);
      } else {
        total.acceQty += parseInt(rawData[i].quantity);
      }
      total.totalPrice += platform.price * rawData[i].quantity;
    }

    $('#totalCaseQuantity').text(total.caseQty.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
    $('#totalQuantity').text((total.caseQty + total.acceQty).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
    $('#totalPrice').text(total.totalPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));



    // 발주서용 데이터 구조화
    let orderPaperDataMap = createOrderPaperData(rawData);

    setOrderPaperOrderRow(orderPaperDataMap);

    // 상세 주문내역용 데이터 구조화
    //let orderDetailDataMap = createOrderDetailData(rawData);
    let orderDetailDataMap = createThumbnailData(rawData);
    setOrderDetailTemplateTab(orderDetailDataMap);


    // 미리보기
    // $templateArea.show();


	  fs.writeFile('C:/발주서.html', $templateArea.html(), 'utf8', function (err) {
		  if (err) {
			  throw err;
		  }
		  console.log('write ok');
      alert('발주서 생성이 완료되었습니다.\n(C:/발주서.html)');
	  });
  };
});

/**
 * 템플릿별로 그룹핑하여 주문 목록 생성
 * @param rawData
 * @returns {Map}
 */
var createOrderPaperData = (rawData) => {
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
    let filteredRawData = rawData.filter((data) => {
      return data.template === key;
    });

    // 주문 목록 생성
    let orderPaperData = [];
    for (let key in filteredRawData) {
      let data = filteredRawData[key];
      //console.log('filteredRawData['+key+']='+JSON.stringify(data));

      // 이미 존재하면 수량 증가
      let isExist = orderPaperData.some((element) => {
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
var setOrderPaperOrderRow = (orderPaperDataMap) => {
  let $row = $('#order-list');

  orderPaperDataMap.forEach((value, key, map) => {
    console.log(`orderPaperDataMap.get(${key})=${JSON.stringify(orderPaperDataMap.get(key))}`);

    let v = orderPaperDataMap.get(key)[0];
    let firstRow = `
      <tr>
        <td rowspan="${value.length}">${templates.get(v.template).label}</td>
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
 *
 * @param orderDetailDataMap
 */
let setOrderDetailTemplateTab = (orderDetailDataMap) => {
  // 좌측 탭메뉴에 템플릿 추가
  let $leftMenu = $('#left-menu');
  orderDetailDataMap.forEach((value, key, map) => {
    let menuItem = `<li><a href="#tabs-${key.toLowerCase()}">${templates.get(key).label}</a></li>`;
    console.log(`menuItem=${menuItem}`);
    $leftMenu.append(menuItem);
  });

  // 탭에 템플릿 컨텐츠 추가
  let $tabs = $('#tabs-left');
  orderDetailDataMap.forEach((thumbnailInfo, templateKey, map) => {
    let tabHtml = `
      <div id="tabs-${templateKey.toLowerCase()}" class="template-tab">
        <div>`;
    for (let deviceKey in thumbnailInfo) {
      tabHtml += `
          <table id="${templateKey.toLowerCase()}-${deviceKey.toLowerCase()}">
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
                <th colspan="10" class="text-red">${devices.get(deviceKey)} ${templates.get(templateKey).label}</th>
              </tr>
            </thead>
            <tbody>`;
      let thumbnails = thumbnailInfo[deviceKey],
          thmIdx = 0;
      for (let thumbnailKey in thumbnails) {
        if (thmIdx % 10 === 0) {
          tabHtml += '<tr>';
        }
        tabHtml += `<td>
                      <div><img src="${thumbnailRoot}/${thumbnails[thumbnailKey].template}/${thumbnails[thumbnailKey].designCode}_${thumbnails[thumbnailKey].template}_${thumbnails[thumbnailKey].designSubCode}.jpg"
                                alt="${thumbnails[thumbnailKey].designCode}_${thumbnails[thumbnailKey].template}_${thumbnails[thumbnailKey].designSubCode}"
                                onerror="this.src='http://webagency.pe.kr/thumbnail/imagenotfound.jpg'"
                                class="thumbnail"></div>
                      <div class="qty">${thumbnails[thumbnailKey].quantity}</div>
                    </td>`;
        thmIdx++;
        if (thmIdx % 10 === 0) {
          tabHtml += '</tr>';
        }
      }
      let blanks = 10 - (thumbnails.length % 10);
      for (let k = 0; k < blanks; k++) {
        tabHtml += `<td>
                      <div><img src="${__dirname}/resources/blank.jpg" class="thumbnail"></div>
                      <div class="qty"></div>
                    </td>`;
      }
      if (blanks > 0) {
        tabHtml += '</tr>';
      }
      tabHtml += `
            </tbody>
          </table>
          <button type="button" name="templatePrint" data-tab-id="#${templateKey.toLowerCase()}-${deviceKey.toLowerCase()}">인쇄</button>
          <br><br>`;
    }
    tabHtml += `
        </div>
      </div>`;

    $tabs.append(tabHtml);
  });
};

let htModule = (function () {
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
