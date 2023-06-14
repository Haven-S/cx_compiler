#ifndef MAIN_VM
#define MAIN_VM

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <memory.h>
#include <unistd.h>

#define amax 2048			/* 地址上界*/
#define cxmax 200			/* 最多的虚拟机代码数 */
#define stacksize 500 /* 运行时数据栈元素最多为500个 */

#define symbolMax 100       /* 符号表容量 */
#define structMax 10        /* 结构体最大数量 */
#define nameLenMax 10        /* 标识符的最大长度 */
#define codeblockMax 10        /* 程序块数量,也是符号表数量 */
#define maxNestedNum 10

/* 虚拟机代码指令 */
enum fct
{
	lit,
	opr,
	lod,
	sto,
	cal,
	ini,
	jmp,
	jpc,
};

/* 虚拟机代码结构 */
struct instruction
{
	enum fct f; /* 虚拟机代码指令 */
	int l;			/* 引用层与声明层的层次差 */
	int a;			/* 根据f的不同而不同 */
	int line;   /* 源代码所在行 */
	int blockCnt; /* 源代码所在代码块编号 */
};
struct instruction code[cxmax]; /* 存放虚拟机代码的数组 */

int tx; /* 符号表当前尾指针 */
int cx; /* 虚拟机代码指针, 取值范围[0, cxmax-1] */

int num;
int listswitch;	 /* 显示虚拟机代码与否 */
int tableswitch; /* 显示符号表与否 */
int debugswitch; /* 调试模式开启与否 */
char debugmode;
int prevline;
int startBlock;

FILE *fin;		 /* 输入源文件 */
FILE *ftable;	 /* 输出符号表 */
FILE *fstack;	 /* 输出运行栈 */
FILE *fcode;	 /* 输出虚拟机代码 */
FILE *fcodeindex; /* 输出执行的代码指针 */
FILE *foutput; /* 输出出错示意（如有错） */
FILE *fresult; /* 输出执行结果 */
FILE *fdebug; /* 输入调试指令 */
char fname[20];
int err;
extern int line;


int codeblockStk[codeblockMax];//用于保存当前程序块的开始位置
int codeblockNumStk[codeblockMax];
int stkIndex;//栈顶指针,指向栈顶元素下一位
int stkCnt;//程序块编号

int ifJpcStk[codeblockMax];//用于保存if的跳转位置
int ifJpcIndex;//栈顶指针,指向栈顶元素下一位

int elseJmpStk[codeblockMax];//用于保存else的跳转位置
int elseJmpIndex;//栈顶指针,指向栈顶元素下一位

int blockNum;
int maxBlockNum;



void init();
void gen(enum fct x, int y, int z);
void listall();
void interpret();
int base(int l, int *s, int b);


int yyerror(char *s)
{
	err = err + 1;
	printf("%s in line %d\n", s, line);
	fprintf(foutput, "%s in line %d\n", s, line);
	// return 0;
}
/* 初始化 */
void init()
{
	tx = 0;
	cx = 0;
	num = 0;
	err = 0;
	debugmode = 'o';
}

/* 生成虚拟机代码 */
void gen(enum fct x, int y, int z)
{
	if (cx >= cxmax)
	{
		yyerror("Program is too long!\n"); /* 生成的虚拟机代码程序过长 */
	}
	if (z >= amax)
	{
		yyerror("Displacement address is too big!\n"); /* 地址偏移越界 */
	}
	code[cx].f = x;
	code[cx].l = y;
	code[cx].a = z;
	code[cx].line = line;
	code[cx].blockCnt = codeblockNumStk[stkIndex-1];
	cx++;
}

/* 输出所有目标代码  */
void listall()
{
	int i;
	char name[][5] =
			{
					{"lit"},
					{"opr"},
					{"lod"},
					{"sto"},
					{"cal"},
					{"int"},
					{"jmp"},
					{"jpc"},
			};
	if (listswitch)
	{
		for (i = 0; i < cx; i++)
		{
			// printf("%d %s %d %d\n", i, name[code[i].f], code[i].l, code[i].a);
			fprintf(fcode, "%s %d %d %d %d\n", name[code[i].f], code[i].l, code[i].a,code[i].line,code[i].blockCnt);
		}
	}
}

void interpret_onestep(int *s, int *p, int *b, int *t,int* blockBases)
{
	struct instruction i; /* 存放当前指令 */
	i = code[*p];					/* 读当前指令 */
	int currentline = i.line;
	if (debugswitch)
	{
		int pause = 0;
		if(debugmode == 'e'){
			pause = 0;
		}
		else if(debugmode == 'l'){
			if(prevline != currentline){
				pause = 1;
			}
		}
		else if(debugmode == 'b'){
			if(startBlock <= 0){
				pause = 1;
			}
		}
		else{
			pause = 1;
		}
		fprintf(fcodeindex, "%d\n", *p + 1);
		fflush(fcodeindex);
		if(pause){
			fopen("fdebug.txt", "w");
			fclose(fdebug);
			char buffer[1024];
			// 循环等待文件有内容可读取
			while (1) {
					if ((fdebug = fopen("fdebug.txt", "r+")) == NULL)
					{
							printf("Can't open fdebug.txt file!\n");
							exit(1);
					}
					if (fgets(buffer, sizeof(buffer), fdebug) != NULL) {
							// 读取到内容，打印并退出循环
							printf("debug command:%s\n", buffer);
							fclose(fdebug);
							fopen("fdebug.txt", "w");
							fclose(fdebug);
							debugmode = buffer[0];
							if(debugmode == 'b'){
								startBlock = 1;
							}
							else if(debugmode == 'l'){
								prevline = currentline;
							}
							break;
					}
					fclose(fdebug);
					// 文件无内容时等待0.5秒
					usleep(500000);
    		}
		}
    
	}

	*p = *p + 1;
	prevline = currentline;
	

	switch (i.f)
	{
	case lit: /* 将常量a的值取到栈顶 */
		*t = *t + 1;
		s[*t] = i.a;
		break;
	case opr: /* 数学、逻辑运算 */
		switch (i.a)
		{
		case 0: /* 函数调用结束后返回 */
			*t = *b - 1;
			*p = s[*t + 3];
			*b = s[*t + 2];
			break;
		case 1: /* 栈顶元素取反 */
			s[*t] = -s[*t];
			break;
		case 2: /* 次栈顶项加上栈顶项，退两个栈元素，相加值进栈 */
			*t = *t - 1;
			s[*t] = s[*t] + s[*t + 1];
			break;
		case 3: /* 次栈顶项减去栈顶项 */
			*t = *t - 1;
			s[*t] = s[*t] - s[*t + 1];
			break;
		case 4: /* 次栈顶项乘以栈顶项 */
			*t = *t - 1;
			s[*t] = s[*t] * s[*t + 1];
			break;
		case 5: /* 次栈顶项除以栈顶项 */
			*t = *t - 1;
			s[*t] = s[*t] / s[*t + 1];
			break;
		case 6: /* 次栈顶项取余栈顶项 */
			*t = *t - 1;
			s[*t] = s[*t] % s[*t + 1];
			break;
		case 7: /* 栈顶元素的奇偶判断 */
			s[*t] = s[*t] % 2;
			break;
		case 8: /* 次栈顶项与栈顶项是否相等 */
			*t = *t - 1;
			s[*t] = (s[*t] == s[*t + 1]);
			break;
		case 9: /* 次栈顶项与栈顶项是否不等 */
			*t = *t - 1;
			s[*t] = (s[*t] != s[*t + 1]);
			break;
		case 10: /* 次栈顶项是否小于栈顶项 */
			*t = *t - 1;
			s[*t] = (s[*t] < s[*t + 1]);
			break;
		case 11: /* 次栈顶项是否大于等于栈顶项 */
			*t = *t - 1;
			s[*t] = (s[*t] >= s[*t + 1]);
			break;
		case 12: /* 次栈顶项是否大于栈顶项 */
			*t = *t - 1;
			s[*t] = (s[*t] > s[*t + 1]);
			break;
		case 13: /* 次栈顶项是否小于等于栈顶项 */
			*t = *t - 1;
			s[*t] = (s[*t] <= s[*t + 1]);
			break;
		case 14: /* 栈顶值输出 */
			printf("%d", s[*t]);
			fprintf(fresult, "%d", s[*t]);
			fflush(fresult);
			*t = *t - 1;
			break;
		case 15: /* 输出换行符 */
			printf("\n");
			fprintf(fresult, "\n");
			fflush(fresult);
			break;
		case 16: /* 读入一个输入置于栈顶 */
			*t = *t + 1;
			printf("?");
			fprintf(fresult, "?");
			fflush(fresult);
			scanf("%d", &(s[*t]));
			fprintf(fresult, "%d\n", s[*t]);
			fflush(fresult);
			break;
		case 17: /* 逻辑与 */
			*t = *t - 1;
			s[*t] = (s[*t] == 1 && s[*t + 1] == 1) ? 1 : 0;
			break;
		case 18: /* 逻辑或 */
			*t = *t - 1;
			s[*t] = (s[*t] == 1 || s[*t + 1] == 1) ? 1 : 0;
			break;
		case 19: /* 逻辑非 */
			s[*t] = s[*t] == 0 ? 1 : 0;
			break;
		case 20: /* 逻辑异或 */
			*t = *t - 1;
			s[*t] = (s[*t] == 1 && s[*t + 1] == 0) || (s[*t] == 0 && s[*t + 1] == 1) ? 1 : 0;
			break;
		case 21: /* 进入程序块 */
			blockBases[i.blockCnt] = *t + 1;
			// printf("--%d %d %d\n",*t,*b,i.l);
			s[*t + 1] = base(i.l, s, *b); /* 将父过程基地址入栈，即建立静态链 */
			s[*t + 2] = *b;								/* 将本过程基地址入栈，即建立动态链 */
			*b = *t + 1;									/* 改变基地址指针值为新过程的基地址 */
			// printf("---%d %d %d\n",*t,*b,i.l);
			if(debugmode == 'b'){
				startBlock ++;
			}
			break;
		case 22: /* 退出程序块 */
			*t = *b - 1;
			*b = s[*t + 2];
			if(debugmode == 'b'){
				startBlock --;
			}
			break;
		}
		break;
	case lod: /* 取相对当前过程的数据基地址为a的内存的值到栈顶 */
		*t = *t + 1;
		s[*t] = s[base(i.l, s, *b) + i.a];
		// printf("lod l *b a s[*t] %d %d %d %d\n",i.l,*b,i.a,s[*t]);
		// printf("lod s[*t] %d\n",base(i.l,s,*b) + i.a);
		break;
	case sto: /* 栈顶的值存到相对当前过程的数据基地址为a的内存 */
		s[base(i.l, s, *b) + i.a] = s[*t];
		*t = *t - 1;
		// printf("sto l *b a s[*t] %d %d %d %d\n",i.l,*b,i.a,s[*t+1]);
		// printf("sto s[*t] %d\n",base(i.l,s,*b) + i.a);
		break;
	case cal:												/* 调用子过程 */
		s[*t + 1] = base(i.l, s, *b); /* 将父过程基地址入栈，即建立静态链 */
		s[*t + 2] = *b;								/* 将本过程基地址入栈，即建立动态链 */
		s[*t + 3] = *p;								/* 将当前指令指针入栈，即保存返回地址 */
		*b = *t + 1;									/* 改变基地址指针值为新过程的基地址 */
		*p = i.a;											/* 跳转 */
		break;
	case ini: /* 在数据栈中为被调用的过程开辟a个单元的数据区 */
		*t = *t + i.a;
		break;
	case jmp: /* 直接跳转 */
		*p = i.a;
		break;
	case jpc: /* 条件跳转 */
		if (s[*t] == 0)
			*p = i.a;
		*t = *t - 1;
		break;
	}

	if (debugswitch)
	{
		if ((fstack = fopen("fstack.txt", "w")) == NULL)
		{
			printf("Can't open fstack.txt file!\n");
			exit(1);
		}
		for (int i = 0; i <= *t; i++)
		{
			fprintf(fstack, "%d\n", s[i]);
		}
		fprintf(fstack, "base\n");
		for (int i = 0; i <= stkCnt; i++)
		{
			fprintf(fstack, "%d\n", blockBases[i]);
		}
		fclose(fstack);
	}
}

int codeblockNumStk[codeblockMax];
int stkIndex;//栈顶指针,指向栈顶元素下一位
int stkCnt;//程序块编号


/* 解释程序 */
void interpret()
{
	int blockBases[codeblockMax];
	for(int i=0;i<codeblockMax;i++){
		blockBases[i] = 0;
	}
	
	
	int p = 0; /* 指令指针 */
	int b = 1; /* 指令基址 */
	int t = 0; /* 栈顶指针 */

	int s[stacksize]; /* 栈 */
	for(int idx = 0;idx<stacksize;idx++){
		s[idx] = 0;
	}

	printf("Start cx\n");
	fprintf(fresult, "Start cx\n");
	fflush(fresult);
	s[0] = 0; /* s[0]不用 */
	s[1] = 0; /* 主程序的三个联系单元均置为0 */
	s[2] = 0;
	s[3] = 0;
	do
	{
		interpret_onestep(s, &p, &b, &t,blockBases);
	} while (p != 0);
	printf("End cx\n");
	fprintf(fresult, "End cx\n");
	fflush(fresult);
}

/* 通过过程基址求上l层过程的基址 */
int base(int l, int *s, int b)
{
	int b1;
	b1 = b;
	while (l > 0)
	{
		b1 = s[b1 + 1];
		l--;
	}
	return b1;
}

#endif