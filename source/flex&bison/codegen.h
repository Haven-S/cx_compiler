#ifndef MAIN_CG  
#define MAIN_CG

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "vm.h"

/* 符号表中的类型 */
enum symbolType {
    integer, 
    boolean,
    structDef,
    structDecl
};


/* 符号结构 */
typedef struct symbol{
    char name[nameLenMax];     // 名字
    enum symbolType type; // 类型
    int level;          // 所处层 
	int address;            // 地址
    int blockNum;
    int blockCnt;
    int structIndex; //记录结构体长度
    int structLen; //记录结构体长度
} Symbol;

// 符号表
Symbol symbolTable[symbolMax];
int symIndex;//指向下一位可用下标





void codegenInit(){
    symIndex = 0;
    stkIndex = 0;
    stkCnt = 0;
    ifJpcIndex = 0;
}



void codeblockStart() {
    if(stkIndex>=codeblockMax){
        yyerror("The maximum number of nested program blocks has been reached");
    }
    else{
        maxBlockNum = 0;
        blockNum = 0;
        codeblockStk[stkIndex] = symIndex;
        codeblockNumStk[stkIndex] = stkCnt;
        stkIndex++;
        stkCnt++;
    }

}

void codeblockEnd() {
    stkIndex--;
    symIndex = codeblockStk[stkIndex];
}

void structDefStart() {
    maxBlockNum ++;
    blockNum = maxBlockNum;
}

void structDefEnd(){
    blockNum = 0;
}

void listSymbolTable(){
    if(stkIndex>0){
        fprintf(ftable, "#start\n");
        for (int i = 0; i < symIndex; i++)
        {
            Symbol* sym = &symbolTable[i];
            fprintf(ftable, "%s %d %d %d %d %d %d\n", sym->name,sym->type,sym->level,sym->address,sym->blockCnt,sym->structIndex,sym->structLen);
        }
        fprintf(ftable, "#end\n");
    }

}

// 在符号表中插入一个新符号
int insertSymbol(char *name, enum symbolType type) {
    if (symIndex >= symbolMax) {
        yyerror("The maximum number of symbols has been reached\n");
    }
    strcpy(symbolTable[symIndex].name, name); // 复制名字
    symbolTable[symIndex].type = type; // 设置类型
    symbolTable[symIndex].level = stkIndex; // 设置层级
    symbolTable[symIndex].blockNum = blockNum;
    symbolTable[symIndex].blockCnt = codeblockNumStk[stkIndex-1];
    symIndex++;

    return symIndex - 1;

}

/* 在符号表中查找一个符号 */
int findSymbol(char *name) {

    for (int i = symIndex - 1; i >=0 ; i--) {
        if (strcmp(symbolTable[i].name, name) == 0 && (symbolTable[i].blockNum ==0 || symbolTable[i].blockNum == blockNum)) {
            return i;  // 找到符号，返回其下标
        }
    }
    return -1; // 没有找到符号，返回-1
}

/* 在当前程序块作用域中查找一个符号 */
int findSymbolinBlock(char *name){
    int symbolBound = codeblockStk[stkIndex-1];
    for (int i = symIndex - 1; i >=symbolBound ; i--) {
        if (strcmp(symbolTable[i].name, name) == 0 && (symbolTable[i].blockNum ==0 || symbolTable[i].blockNum == blockNum)) {
            return i;  // 找到符号，返回其下标
        }
    }
    return -1; // 没有找到符号，返回-1
}

/*在结构体内查找符号*/
int findSymbolinStruct(int index,char* name){
    int structLen = symbolTable[index].structLen;
    // printf("len %d\n",structLen);
    for(int i=1;i<=structLen;i++){
        // printf("%d %s %d %d\n",i,symbolTable[index + i].name,symbolTable[index + i].type,symbolTable[index + i].address);
        if(strcmp(symbolTable[index + i].name, name) == 0){
            return index + i;
        }
    }
    return -1;
}

int check_defined(char *name){
    if(findSymbolinBlock(name)!=-1){
        yyerror("Variable duplicate declaration");
        return 1;
    }
    return 0;
}

int declare_int(char *name) {
    // printf("%s declared_int\n",name);
    if(!check_defined(name)){
        insertSymbol(name, integer);
        return 1;
    }
    return 0;
}

int declare_bool(char *name) {
    // printf("%s declared_bool\n",name);
    if(!check_defined(name)){
        insertSymbol(name, boolean);
        return 1;
    }
    return 0;
}

void define_struct(char *name){
    if(!check_defined(name)){
        int idx = insertSymbol(name, structDef);
        symbolTable[idx].structIndex = -1;
    }
}

int declare_struct(int structIndex,char* name){
    if(!check_defined(name)){
        int idx = insertSymbol(name, structDef);
        symbolTable[idx].structIndex = structIndex;
        symbolTable[idx].structLen = 0;
        return 1;
    }
    return 0;
} 

int instantiate_struct(int structIndex,char* name,int nestedNum){
    if(!check_defined(name)){

        int idx = insertSymbol(name, structDecl);
        int structLen = symbolTable[structIndex].structLen;
        symbolTable[idx].structIndex = structIndex;
        symbolTable[idx].structLen = structLen;
        // printf("insert %s %d %d\n",symbolTable[idx].name,symbolTable[idx].type,symbolTable[idx].structIndex);
        structDefStart();
        int ret = structLen + 1;
        for(int i=1;i<=structLen;i++){
            if(symbolTable[structIndex+i].type == structDef){
                if(nestedNum > maxNestedNum){
                    yyerror("Struct instantiation failed: The maximum depth of nested declarations is exceeded");
                }
                else{
                    ret += instantiate_struct(symbolTable[structIndex+i].structIndex,symbolTable[structIndex+i].name,nestedNum+1);
                }
            }
            else{
                insertSymbol(symbolTable[structIndex+i].name,symbolTable[structIndex+i].type);
            }
            
        }
        structDefEnd();
        return ret;
    }
    return 0;
}

void fill_struct_len(int num){
    int structIndex = symIndex -1 -num;
    symbolTable[structIndex].structLen = num;
    // printf("%s %d\n",symbolTable[structIndex].name,symbolTable[structIndex].type);
}

int is_int(int index){
    enum symbolType type = symbolTable[index].type;
    return type == integer?1:0;
}

int is_bool(int index){
    enum symbolType type = symbolTable[index].type;
    return type == boolean?1:0;
}

int is_struct_def(int index){
    // printf("%s %d %d\n",symbolTable[index].name,symbolTable[index].type,symbolTable[index].address);
    enum symbolType type = symbolTable[index].type;
    return type == structDef?1:0;
}

int is_struct_decl(int index){
    // printf("%s %d %d\n",symbolTable[index].name,symbolTable[index].type,symbolTable[index].address);
    enum symbolType type = symbolTable[index].type;
    return type == structDecl?1:0;
}

int getOriginStructIndex(int structIndex){
    if(symbolTable[structIndex].structIndex!=-1){
        return symbolTable[structIndex].structIndex;
    }
    return structIndex;
}

int is_same_type(int index1,int index2){
    enum symbolType type1 = symbolTable[index1].type;
    enum symbolType type2 = symbolTable[index2].type;
    if(type1!=type2){
        return 0;
    }
    if(type1==structDecl){
        return getOriginStructIndex(index1)==getOriginStructIndex(index2)?1:0;
    }
    return 1;

}

char* getType(int index){
    enum symbolType type = symbolTable[index].type;
    switch (type)
    {
    case integer:
        return "int";
        break;
    case boolean:
        return "bool";
        break;
    default:
        break;
    }
}



//分配相对地址
void allocate_address(int n){
	int i;
	for(i = 1; i <= n; i++)
		symbolTable[symIndex - i].address = n - i + 3; //0-3是保留位
}

void ifStart(){
    if(ifJpcIndex>=codeblockMax){
        yyerror("The maximum number of nested IF blocks has been reached");
    }
    else{
        ifJpcStk[ifJpcIndex] = cx;
        ifJpcIndex++;
    }

}

int ifEnd(){
    return ifJpcStk[--ifJpcIndex];
}

void elseStart(){
    if(elseJmpIndex>=codeblockMax){
        yyerror("The maximum number of nested ELSE blocks has been reached");
    }
    else{
        elseJmpStk[elseJmpIndex] = cx;
        elseJmpIndex++;
    }

}

int elseEnd(){
    return elseJmpStk[--elseJmpIndex];
}

void assign(int id0,int id1){
    if(is_struct_decl(id0)){
        int len = symbolTable[id0].structLen;
        for(int i=1;i<=len;i++){
            assign(id0+1,id1+1);
        }
    }
    else{
        gen(lod, stkIndex  - symbolTable[id1].level, symbolTable[id1].address);
        gen(sto, stkIndex  - symbolTable[id0].level, symbolTable[id0].address);
    }
}

#endif