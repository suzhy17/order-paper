'use strict';

const fs = require('fs');
XLSX = require('xlsx');

const thumbnailRoot = 'C:/thumbnail';
const outputRoot = 'C:/발주서';

var platforms = {};

const tabGroup = new Map([
    ['BLACK'  , {label: '블랙케이스'    , sort: 1}],
    ['TWINK'  , {label: '트윙클케이스'  , sort: 2}],
    ['LEATH'  , {label: '레더케이스'    , sort: 3}],
    ['SOFTT'  , {label: '소프트케이스'  , sort: 4}],
    ['SPRIT'  , {label: '스피릿케이스'  , sort: 5}],
    ['SPRITSP', {label: '디자인커버'    , sort: 6}],
    ['COILL'  , {label: '코일룩'        , sort: 7}],
    ['SMART'  , {label: '스마트클리너'  , sort: 8}],
    ['BTTRY'  , {label: '보조배터리'    , sort: 9}],
    ['GLASS'  , {label: '강화유리'      , sort: 10}],
    ['IPJEN'  , {label: '아이폰젠더'    , sort: 11}],
    ['CABLE'  , {label: '애플케이블'    , sort: 12}],
    ['LED'    , {label: 'LED'           , sort: 13}],
]);

const exceptionTemplates = [
    'BTTRY_5CA',
    'BTTRY_10CA',
    'ACC_COILL'
];

const devices = new Map([
    ['IP5', '아이폰5'],
    ['IP6', '아이폰6'],
    ['IP7', '아이폰7'],
    ['IP8', '아이폰8'],
    ['IP6P', '아이폰6플러스'],
    ['IP7P', '아이폰7플러스'],
    ['IP8P', '아이폰8플러스'],
    ['IPX', '아이폰X'],
    ['IPFX', '아이폰X'],
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
    ['5CA', '5,000mAh'],
    ['10CA', '10,000mAh'],
    ['', '단일'],
]);

let groupBy = function(xs, key) {
    return xs.reduce(function(rv, x) {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
    }, {});
};

let gridData = [];
var $templateArea = $('#templateArea');
let orderDate = '';

$(document).ready(function () {

    fs.readFile(__dirname+'/config/platforms.json', 'utf8', function (err, data) {
        platforms = JSON.parse(data);
        platformsHtModule.init();
    });

    // console.log('platforms=' + JSON.stringify(platforms));

    $('a.nav-link').click(function () {
        // 메뉴탭 활성/비활성
        $('a.nav-link').removeClass('active');
        $(this).addClass('active');

        // 클릭한 페이지 보이기
        let contentId = $(this).attr('href');
        $('.tab-content').hide();
        $(contentId).show();
    });

    $('#create').click(function () {
        try {

            if (!gridData) {
                alert('주문 파일을 먼저 선택하세요.');
                return;
            }

            try {
                let fileName = $('#xlf')[0].files[0].name;
                let fileNames = fileName.split('_');
                let lastName = fileNames[fileNames.length - 1].split('.');
                if (lastName[0].length !== 8) {
                    throw "order date";
                }
                orderDate = `${parseInt(lastName[0].substring(4, 6))}월 ${parseInt(lastName[0].substring(6, 8))}일`;
                // alert('orderDate=' + orderDate);
            } catch (e) {
                alert(`주문 파일명을 확인해주세요.\n파일명 마지막에 '_년월일'이 있어야합니다.\n예> 매장발주서_20180627.xlsx`);
                return;
            }

            // 입력 데이터 파싱, 검증
            let inputDatas = [];
            for (let i = 0; i < gridData.length; i++) {
                let designTemplateDevice = parseEpsDesignCode(gridData[i].EPS_DESIGN_CODE);

                inputDatas[i] = {
                    shop: gridData[i].REQUESTER,
                    tabGroup: designTemplateDevice.tabGroup,
                    template: designTemplateDevice.template,
                    device: designTemplateDevice.device,
                    designCode: designTemplateDevice.design,
                    designSubCode: gridData[i].DESIGN_SUB_CODE,
                    quantity: parseInt(gridData[i].QUANTITY)
                };
            }

            // 존재하지 않는 기기코드가 있는지 체크
            checkDevice(inputDatas);

            // 중복 제거 (수량만 합치기)
            let rawData = [];
            inputDatas.reduce(function (res, value) {
                let resKey = value.shop + value.template + value.device + value.designCode + value.designSubCode;
                if (!res[resKey]) {
                    res[resKey] = {
                        shop: value.shop,
                        tabGroup: value.tabGroup,
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

            console.log('==================');
            rawData.forEach((data) => {
                console.log(`shop: ${data.shop}, tabGroup: ${data.tabGroup}, template: ${data.template}, device: ${data.device}, designCode: ${data.designCode}, designSubCode: ${data.designSubCode}, quantity: ${data.quantity}`);
            });

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

            // 매장별 데이터 분리
            let shops = {};
            rawData.forEach((data) => {
                if (!shops[data.shop]) {
                    shops[data.shop] = [];
                }
                shops[data.shop].push(data);
            });

            // 발주서 생성
            let shopCnt = 0;
            for (let shopsKey in shops) {
                createOrderPaper(shops[shopsKey]);
                shopCnt++;
            }

            alert(`[${outputRoot}] 폴더에 ${shopCnt} 개의 발주서가 생성되었습니다.`);
        }
        catch (e) {
            console.log(`[${e.name}] ${e.message}`);
            alert(e.message);
        }
    });

    $('#platformSave').click(function () {
        alert('죄송합니다. 준비중입니다.');
    });
});

var parseEpsDesignCode = function (epsDesignCode) {
    let exceptionTemplate = '';
    exceptionTemplates.forEach((templateName) => {
        if (epsDesignCode.includes(templateName)) {
            exceptionTemplate = templateName;
        }
    });

    let arrEpsDesignCode = epsDesignCode.split('_');

    if (exceptionTemplate) {
        return {
            design: arrEpsDesignCode[0],
            template: exceptionTemplate,
            device: arrEpsDesignCode[2],
            tabGroup: getPlatform(exceptionTemplate).tabGroup
        };
    } else {
        return {
            design: arrEpsDesignCode[0],
            template: arrEpsDesignCode[1],
            device: arrEpsDesignCode[2],
            tabGroup: getPlatform(arrEpsDesignCode[1]).tabGroup
        };
    }

    return false;
};

var getPlatform = function (platformCode) {
    for (let key in platforms) {
        if (platforms[key].platform === platformCode) {
            return platforms[key];
        }
    }
};

/**
 * 존재하지 않는 기기코드가 있는지 체크
 * @param inputDatas
 */
var checkDevice = function (inputDatas) {
    let missingDevices = [];
    inputDatas.forEach((data) => {
        if (data.type === 'case' && !devices.get(data.device)) {
            missingDevices.push(data.device);
        }
    });
    if (missingDevices.length > 0) {
        throw (new Error(`일부 기기 코드[${missingDevices.join(", ")}]가 존재하지 않습니다. 설정파일에 기기정보를 먼저 등록하고 프로그램을 재시작 하세요.`));
    }
};

/**
 * 발주서 생성
 * @param rawData
 */
var createOrderPaper = function (rawData) {

    $templateArea.load('./resources/order-template.html', () => {
        $('#shop').text(rawData[0].shop);
        $('#orderDate').text(orderDate);

        let total = {
            caseQty: 0,
            acceQty: 0,
            totalPrice: 0
        };
        for (let i = 0; i < rawData.length; i++) {
            let tmpl = getPlatform(rawData[i].template);
            if (tmpl.type === 'case') {
                total.caseQty += parseInt(rawData[i].quantity);
            } else {
                total.acceQty += parseInt(rawData[i].quantity);
            }
            total.totalPrice += tmpl.price * rawData[i].quantity;
            console.log(`template=${tmpl.label}, ${tmpl.price} * ${rawData[i].quantity} = ${total.totalPrice}`);
        }

        $('#totalCaseQuantity').text(total.caseQty.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
        $('#totalQuantity').text((total.caseQty + total.acceQty).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
        $('#totalPrice').text(total.totalPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));


        // 발주서용 데이터 구조화
        let orderPaperDataMap = createOrderPaperData(rawData);
        setOrderPaperOrderRow(orderPaperDataMap);

        // 상세 주문내역용 데이터 구조화
        let orderDetailDataMap = createThumbnailData(rawData);
        setOrderDetailTemplateTab(orderDetailDataMap);


        fs.writeFile(`${outputRoot}/${rawData[0].shop}_20180628_매장발주서.html`, $templateArea.html(), 'utf8', function (err) {
            if (err) {
                throw err;
            }
            console.log('write ok');
        });
    });
};


/**
 * 썸네일 페이지용 데이터 구조화하여 상세 목록 생성
 * @param rawData
 * @returns {Map}
 */
let createThumbnailData = (rawData) => {
    console.log('=== createThumbnailData ===');
    let tabGroupMap = new Map();
    for (let i = 0; i < rawData.length; i++) {
        if (tabGroupMap.has(rawData[i].tabGroup)) {
            continue;
        }
        tabGroupMap.set(rawData[i].tabGroup, []);
    }

    tabGroupMap.forEach((value, key, map) => {
        // 현재 key에 해당하는 템플릿만 추출
        let filteredList = rawData.filter((data) => data.tabGroup === key);
        let groupByDevice = groupBy(filteredList, 'device');
        console.log(`groupByDevice=${JSON.stringify(groupByDevice)}`);

        // groupByDevice['IP6'].forEach((vo) => console.log(`${vo.template}, ${vo.device}, ${vo.designCode}, ${vo.designSubCode}`));

        for (let deviceKey in groupByDevice){
            console.log(`==> ${deviceKey}`);
            // groupByDevice[deviceKey].
        }

        tabGroupMap.set(key, groupByDevice);
    });
    tabGroupMap.forEach((value, key, map) => {
        console.log(`tabGroupMap.key=${key}`);
    });

    return tabGroupMap;
};

/**
 * 탭그룹별로 그룹핑하여 주문 목록 생성
 * @param rawData
 * @returns {Map}
 */
var createOrderPaperData = (rawData) => {

    let tabGroupMap = new Map();
    for (let i = 0; i < rawData.length; i++) {
        if (tabGroupMap.has(rawData[i].tabGroup)) {
            continue;
        }
        tabGroupMap.set(rawData[i].tabGroup, []);
    }


    tabGroupMap.forEach((value, key, map) => {
        console.log(`key=${key}`);

        // 현재 key에 해당하는 탭그룹만 추출
        let filteredRawData = rawData.filter((data) => {
            return data.tabGroup === key;
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
                    tabGroup: data.tabGroup,
                    template: data.template,
                    device: data.device,
                    quantity: data.quantity
                });
            }
        }
        console.log(`orderPaperData.length=${orderPaperData.length}`);
        tabGroupMap.set(key, orderPaperData);
    });

    return tabGroupMap;
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
            <td rowspan="${value.length}"><b>${tabGroup.get(v.tabGroup).label}</b></td>
            <td>${v.template}${v.device ? '-' : ''}${v.device}</td>
            <td><a href="#${v.template.toLowerCase()}-${v.device.toLowerCase()}">${devices.get(v.device) || '단일'}</a></td>
            <td class="text-right">${v.quantity}</td>
            <td></td>
          </tr>`;
        $row.append(firstRow);

        for (let i = 1; i < orderPaperDataMap.get(key).length; i++) {
            v = orderPaperDataMap.get(key)[i];
            let otherRow = `
              <tr>
                <td>${v.template}${v.device ? '-' : ''}${v.device}</td>
                <td><a href="#${v.template.toLowerCase()}-${v.device.toLowerCase()}">${devices.get(v.device) || '단일'}</a></td>
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
    let tabKeys = [];
    orderDetailDataMap.forEach((value, key, map) => {
        tabKeys.push(key);
    });


    // 정렬
    tabKeys = tabKeys.sort((a, b) => {
        if (tabGroup.get(a).sort === tabGroup.get(b).sort) {
            return 0;
        } else if (tabGroup.get(a).sort < tabGroup.get(b).sort) {
            return -1;
        } else {
            return 1;
        }
    });

    tabKeys.forEach((key) => {
        let menuItem = `<li><a href="#tabs-${key.toLowerCase()}">${tabGroup.get(key).label}</a></li>`;
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
                    <th colspan="10" class="text-red">${devices.get(deviceKey) || '' } ${tabGroup.get(templateKey).label}</th>
                  </tr>
                </thead>
                <tbody>`;
            let thumbnails = thumbnailInfo[deviceKey],
                thmIdx = 0;
            for (let thumbnailKey in thumbnails) {
                if (thmIdx % 10 === 0) {
                    tabHtml += '<tr>';
                }
                tabHtml += `
                    <td>
                      <div><img src="${thumbnailRoot}/${thumbnails[thumbnailKey].template}/${thumbnails[thumbnailKey].designCode}_${thumbnails[thumbnailKey].template}_${thumbnails[thumbnailKey].designSubCode}.jpg"
                                alt="${thumbnails[thumbnailKey].designCode}_${thumbnails[thumbnailKey].template}_${thumbnails[thumbnailKey].designSubCode}"
                                onerror="this.src='http://webagency.pe.kr/thumbnail/imagenotfound.jpg'"
                                class="thumbnail"></div>
                      <div class="design-code">${thumbnails[thumbnailKey].designCode}</div>
                      <div class="design-sub-code">${thumbnails[thumbnailKey].designSubCode}</div>
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
                      <div><img src="https://orig00.deviantart.net/ea3c/f/2010/104/9/e/blank_page_____by_neoslashott.png" class="thumbnail"></div>
                      <div class="design-code">&nbsp;</div>
                      <div class="design-sub-code">&nbsp;</div>
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

// 그리드
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
    colHeaders: ['EPS_DESIGN_CODE', 'TEMPLATE_CODE', 'DESIGN_SUB_CODE', 'QUANTITY', 'REQUESTER'],
    columns: [
      {data: 'EPS_DESIGN_CODE'},
      {data: 'TEMPLATE_CODE'},
      {data: 'DESIGN_SUB_CODE'},
      {data: 'QUANTITY'},
      {data: 'REQUESTER'}
    ],
    // minSpareRows: 10000,
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


// 상품관리 그리드
const platformsHtModule = (function () {
    const settings = {
        container: document.getElementById('platform-grid')
    };

    const handsonTable = new Handsontable(settings.container, {
        data: platforms,
        // dataSchema: {
        //     platform: null,
        //     type: null,
        //     label: null,
        //     tabGroup: null,
        //     price: null
        // },
        search: true,
        // startRows: 0,
        // startCols: 2,
        width: 850,
        height: 395,
        colWidths: [150, 100, 200, 150, 150],
        manualColumnResize: true,
        rowHeights: 25,
        rowHeaders: true,
        colHeaders: ['탭그룹', '플랫폼', '타입', '이름', '가격'],
        columns: [
            {data: 'tabGroup'},
            {data: 'platform'},
            {data: 'type'},
            {data: 'label'},
            {data: 'price'}
        ],
        // minSpareRows: 10000,
        maxRows: 10000
    });

    const init = function () {
        handsonTable.loadData(platforms);
        console.log('platforms==>'+JSON.stringify(platforms));
    };

    return {
        init: init
    }
})();

$(function () {
    htModule.init();
});
