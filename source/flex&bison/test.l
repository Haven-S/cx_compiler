%{
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "test.tab.h"
int comment_mode = 0; // 初始状态为非注释模式
int line=1;
%}

/* 定义状态 */
%x COMMENT

digit     [0-9]
letter    [a-zA-Z]
NUM       {digit}+
ID        {letter}({letter}|{digit})*
space     [ \t]

%%

int    { return INT;}
bool   { return BOOL; }
struct { return STRUCT; }
new    { return NEW; }
if     { return IF; }
else   { return ELSE; }
while  { return WHILE; }
do     { return DO; }
repeat { return REPEAT; }
until  { return UNTIL; }
write  { return WRITE; }
read   { return READ; }

true    {return TRUE;}
false   {return FALSE;}


"+"    { return PLUS;}
"-"    { return MINUS; }
"*"    { return MULTIPLY; }
"%"    { return MOLDING;}
"<"    { return LESS_THAN; }
"<="   { return LESS_THAN_OR_EQUAL_TO; }
">"    { return GREATER_THAN; }
">="   { return GREATER_THAN_OR_EQUAL_TO; }
"=="   { return EQUAL_TO; }
"!="   { return NOT_EQUAL_TO; }
"="    { return ASSIGNMENT; }
"||"   { return LOGICAL_OR; }
"&&"   { return LOGICAL_AND; }
"XOR"  { return EXCLUSIVE_OR; }
"!"    { return LOGICAL_NOT; }
";"    { return SEMICOLON; }
"("    { return LEFT_PARENTHESIS; }
")"    { return RIGHT_PARENTHESIS; }
"{"    { return LEFT_BRACE; }
"}"    { return RIGHT_BRACE; }
"."    { return POINT; }

"/" {
    if (comment_mode) {
        // 如果处于注释模式，则不处理
        return 0;
    }
    else {
        return DIVISION;
    }
}
"/*" {
    // printf("注释开始\n");
    /* 开启注释模式 */
    comment_mode = 1;
    BEGIN(COMMENT); // 切换状态到COMMENT
}
<COMMENT>"*/" {
    // printf("注释结束\n");
    /* 关闭注释模式 */
    comment_mode = 0;
    BEGIN(INITIAL); // 切换状态回到初始状态
}
<COMMENT>. { /* 忽略掉注释中的所有字符 */ }

{NUM}  { 
    yylval.number = atoi(yytext);
    return NUM;
}
{ID}   { 
    yylval.ident=(char *)malloc(strlen(yytext)+1);
    strcpy(yylval.ident,yytext);
    return ID; 
}
{space}  { /* 忽略掉空格、制表符 */ }
[\n]	{line++;}


%%

void redirectInput(FILE *input)
{
	yyin=input;
}

int yygetchar(void)
{
	int ret;
	ret = getc(yyin);
	printf("%c",ret);
	return ret;
}

int yywrap(void)
{
	return 1;
}