"use strict";

function fixdata(data) {
	var o = "", l = 0, w = 10240;
	for (; l < data.byteLength / w; ++l) o += String.fromCharCode.apply(null, new Uint8Array(data.slice(l * w, l * w + w)));
	o += String.fromCharCode.apply(null, new Uint8Array(data.slice(l * w)));
	return o;
}

function to_json(workbook) {
	var result = {};
	workbook.SheetNames.forEach(function (sheetName) {
		var roa = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
		if (roa.length > 0) {
			result[sheetName] = roa;
		}
	});
	return result;
}

function handleFile(e, callback) {
	var files = e.target.files;
	var f = files[0];
	{
		var reader = new FileReader();
		reader.onload = function (e) {
			var data = e.target.result;
			var arr = fixdata(data);
			var wb = XLSX.read(btoa(arr), {type: 'base64'});
			var result = to_json(wb);
//			console.log('result='+result);
			callback(result);
		};
		reader.readAsArrayBuffer(f);
	}
}
