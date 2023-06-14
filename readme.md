# 运行说明

test文件夹下是cx测试文件

source文件夹下是源代码，其中electron文件夹存放用户界面应用程序，flex&bison文件夹存放编译器文件



## 源代码使用

1.打开flex&bison文件夹

确保已经安装flex,bison,gcc

依次运行:

```shell
flex test.l
bison -d test.y
gcc -o test test.tab.c lex.yy.c -lfl
```

即可得到编译器可执行文件test.exe

运行：

```shell
test.exe
```

即可运行编译器

注意：编译器运行时会询问是否开启调试模式，由于调试模式需要用户界面才能运行，请不要开启调试模式

2.打开electron文件夹

确保已经安装node.js

将上一步编译生成的test.exe放置于compiler文件夹下

依次运行:

```
npm install
npm run build
npm run start
```

即可启动应用程序

运行：

```
npx electron-builder build
```

即可打包应用程序为可执行文件