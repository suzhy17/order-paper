var createInstaller = require('electron-installer-squirrel-windows')
createInstaller({
  name : 'orderlist',
  product_name: 'orderlist',
  path: './dist/orderlist-win32-ia32',
  out: './dist/installer-win32-ia32',
  authors: 'suzhy',
  exe: 'orderlist.exe',
  appDirectory: './dist/orderlist-win32-ia32',
  overwrite: true
}, function done (e) {
  console.log('Build success !!');
});
