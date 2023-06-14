%{
#include "codegen.h"

void init();
void codegenInit();
int declare_int(char *name);
int declare_bool(char *name);
void define_struct(char *name);
int declare_struct(int structIndex,char* name);
int instantiate_struct(int structIndex,char* name,int originIndex);
void fill_struct_len(int num);
int is_int(int index);
int is_bool(int index);
int is_struct_def(int index);
int is_struct_decl(int index);
int is_same_type(int index1,int index2);
char* getType(int index);
int findSymbol(char *name);
int findSymbolinStruct(int structIndex,char* name);
void ifStart();
int ifEnd();
void elseStart();
int elseEnd();
void allocate_address(int n);
void gen(enum fct x, int y, int z);
void listall();
void displaytable();
void interpret();
void listSymbolTable();
int yyerror(char *s);


%}

%union{
char *ident;
int number;
}
/* 定义token */
%token INT BOOL STRUCT NEW IF ELSE WHILE DO REPEAT UNTIL WRITE READ TRUE FALSE
%token PLUS MINUS MULTIPLY DIVISION MOLDING LESS_THAN LESS_THAN_OR_EQUAL_TO GREATER_THAN GREATER_THAN_OR_EQUAL_TO EQUAL_TO NOT_EQUAL_TO ASSIGNMENT LOGICAL_OR LOGICAL_AND LOGICAL_NOT EXCLUSIVE_OR SEMICOLON LEFT_PARENTHESIS RIGHT_PARENTHESIS LEFT_BRACE RIGHT_BRACE POINT
%token NUM ID
 
%start program

%left PLUS MINUS MULTIPLY DIVISION LOGICAL_OR LOGICAL_AND EXCLUSIVE_OR RIGHT_PARENTHESIS
%right LOGICAL_NOT

%type <ident> ID 
%type <number> id
%type <number> decls decl simp_decls simp_decl
%type <number> num NUM rel_op get_code_addr

%%

program: {
    codegenInit();
}block{
    gen(jmp, 0, 0);
};

block: {
    codeblockStart();
}LEFT_BRACE{
    gen(opr, stkIndex>=1?1:0, 21);
} defs decls{
    int declNum = $5;
    // printf("decl nums: %d\n",declNum);
    allocate_address(declNum);
    listSymbolTable();
    gen(ini, 0, declNum + 3);
} stmts RIGHT_BRACE{
    codeblockEnd();
    gen(opr, 0 , 22);
}
        ;

defs: defs def
        |/*empty*/
        ;

def : STRUCT ID{
    define_struct($2);
    structDefStart();
} LEFT_BRACE simp_decls {
    int declNum = $5;
    fill_struct_len(declNum);
} RIGHT_BRACE SEMICOLON{
    structDefEnd();
};

simp_decls: simp_decls simp_decl{
            $$ = $1 + $2;         /* 传递变量声明的个数 */
        }
        | simp_decl{
            $$ = $1;         /* 传递变量声明的个数 */
        } ;

simp_decl: INT ID SEMICOLON{
            $$ = declare_int($2);
        }
        | BOOL ID SEMICOLON{
            $$ = declare_bool($2);
        }
        | id ID SEMICOLON{
            if(!is_struct_def($1)){
                yyerror("Expected a struct id");
                $$ = 0;
            }
            else{
                $$ = declare_struct($1,$2);
            }
        }
        ;

decls: decls decl{
            $$ = $1 + $2;         /* 传递变量声明的个数 */
        }
        |
        {
            $$ = 0;          /* 没有变量声明 */
        } 
        ;

decl: INT ID SEMICOLON{
            $$ = declare_int($2);
        }
        | BOOL ID SEMICOLON{
            $$ = declare_bool($2);
        }
        | NEW id ID SEMICOLON{
            if(!is_struct_def($2)){
                yyerror("The 'new' keyword can only be used to instantiate struct definitions");
                $$ = 0;
            }
            else{
                $$ = instantiate_struct($2,$3,0);
            }
            
        }
        ;

stmts: stmts stmt
        | /* empty */
        ;

stmt: comp_stmt | incomp_stmt

gen_jpc_if:/*empty*/{
    ifStart();
    gen(jpc, 0 , 0);
};

fill_jpc_if:/*empty*/{
    int prev_cx = ifEnd();
    code[prev_cx].a = cx;
}

gen_jmp_else:/*empty*/{
    elseStart();
    gen(jmp, 0 , 0);
};

fill_jmp_else:/*empty*/{
    int prev_cx = elseEnd();
    code[prev_cx].a = cx;
};


get_code_addr:
               {
               	$$ = cx;
               }
          ;

comp_stmt:IF LEFT_PARENTHESIS bexpr gen_jpc_if RIGHT_PARENTHESIS comp_stmt gen_jmp_else fill_jpc_if ELSE comp_stmt fill_jmp_else
        | WHILE get_code_addr LEFT_PARENTHESIS bexpr RIGHT_PARENTHESIS get_code_addr{
            gen(jpc, 0 , 0);
        } comp_stmt{
            gen(jmp, 0, $2);
            code[$6].a = cx;
        }
        | REPEAT get_code_addr comp_stmt UNTIL LEFT_PARENTHESIS bexpr RIGHT_PARENTHESIS{
            gen(jpc, 0 , $2);
        }
        | DO get_code_addr comp_stmt WHILE LEFT_PARENTHESIS bexpr RIGHT_PARENTHESIS{
            gen(opr, 0 , 19);
            gen(jpc, 0 , $2);
        }
        | id ASSIGNMENT aexpr_noid SEMICOLON{
            if(!is_int($1)){
                yyerror("Cannot assign an int expression to a non-int id");
            }
            else{
                gen(sto, stkIndex  - symbolTable[$1].level, symbolTable[$1].address);
            }

        }
        | id ASSIGNMENT bexpr_noid SEMICOLON{
            if(!is_bool($1)){
                yyerror("Cannot assign a bool expression to a non-bool id");
            }
            else{
                gen(sto, stkIndex  - symbolTable[$1].level, symbolTable[$1].address);
            }
        }
        | id ASSIGNMENT id SEMICOLON{
            if(is_struct_def($1)||is_struct_def($3)){
                yyerror("Cannot use a struct definition id in an assignment expression");
            }
            if(!is_same_type($1,$3)){
                yyerror("Cannot assign an id to another id with different type");
            }
            else{
                assign($1,$3);
            }
        }
        | WRITE aexpr SEMICOLON{
            gen(opr, 0, 14);
            gen(opr, 0, 15);
        } 
        | READ id SEMICOLON{
            gen(opr, 0, 16);
            gen(sto, stkIndex  - symbolTable[$2].level, symbolTable[$2].address);
        }
        | block
        ;

incomp_stmt:IF LEFT_PARENTHESIS bexpr gen_jpc_if RIGHT_PARENTHESIS stmt fill_jpc_if
        | IF LEFT_PARENTHESIS bexpr gen_jpc_if RIGHT_PARENTHESIS comp_stmt gen_jmp_else fill_jpc_if ELSE incomp_stmt fill_jmp_else
        ;

aexpr: aterm  
     | axpr_other  
     ;

aexpr_noid: aterm_noid  
     | axpr_other 
     ;

axpr_other:aterm PLUS aterm{
        gen(opr, 0, 2);
        }                  
     | aterm MINUS aterm{
        gen(opr, 0, 3);
        }                
     ;

aterm: afactor 
     | aterm_other 
     ;

aterm_noid: afactor_noid 
     | aterm_other
     ;

aterm_other:afactor MULTIPLY afactor{
        gen(opr, 0, 4);
        }   
     | afactor DIVISION afactor{
        gen(opr, 0, 5);
        }    
     | afactor MOLDING afactor{
        gen(opr, 0, 6);
        }    
     ;

afactor: id{
            if(!is_int($1)){
                yyerror("Expected an int value");
            }
            else{
                gen(lod, stkIndex - symbolTable[$1].level, symbolTable[$1].address);
            }
            
        }
        | LEFT_PARENTHESIS id RIGHT_PARENTHESIS{
            if(!is_int($2)){
                yyerror("Expected an int value");
            }
            else{
                gen(lod, stkIndex - symbolTable[$2].level, symbolTable[$2].address);
            }
            
        } 
        | afactor_noid
        ;

afactor_noid:num 
        | LEFT_PARENTHESIS aexpr_noid RIGHT_PARENTHESIS 
        ;

bexpr: bterm
        | bexpr_other
        ;

bexpr_noid: bterm_noid
        | bexpr_other
        ;

bexpr_other: bterm LOGICAL_OR bexpr{
    gen(opr, 0, 18);
}
        ;

bterm: bfactor
        | bterm_other
        ;

bterm_noid: bfactor_noid
        | bterm_other
        ;

bterm_other:bfactor LOGICAL_AND bterm{
    gen(opr, 0, 17);
}
        | bfactor EXCLUSIVE_OR bterm{
    gen(opr, 0, 20);
}
        ;

bfactor_noid: TRUE{
            gen(lit, 0, 1);
        } 
        | FALSE{
            gen(lit, 0, 0);
        } 
        | LOGICAL_NOT bfactor {
            gen(opr, 0, 19);
        }
        | LEFT_PARENTHESIS bexpr_noid RIGHT_PARENTHESIS 
        | rel 
        ;

bfactor: id{
            if(!is_bool($1)){
                yyerror("Expected a bool value");
            }
            else{
                gen(lod, stkIndex - symbolTable[$1].level, symbolTable[$1].address);
            }
            
        } 
        | LEFT_PARENTHESIS id RIGHT_PARENTHESIS{
            if(!is_bool($2)){
                yyerror("Expected a bool value");
            }
            else{
                gen(lod, stkIndex - symbolTable[$2].level, symbolTable[$2].address);
            }
            
        }  
        | bfactor_noid
        ;

rel : aid_or_num rel_op aexpr{
    switch($2){
        case 0:
            gen(opr, 0, 10);
            break;
        case 1:
            gen(opr, 0, 13);            
            break;
        case 2:
            gen(opr, 0, 12);
            break;
        case 3:
            gen(opr, 0, 11);
            break;
        case 4:
            gen(opr, 0, 8);
            break;
        case 5:
            gen(opr, 0, 9);
            break;
        default:
            break;
    }
}
    ;

aid_or_num : id{
            if(!is_int($1)){
                yyerror("Expected an int value");
            }
            else{
                gen(lod, stkIndex - symbolTable[$1].level, symbolTable[$1].address);
            }
            
        } 
           | num
           ;

rel_op : LESS_THAN{
            $$ = 0;
        }
       | LESS_THAN_OR_EQUAL_TO{
            $$ = 1;
        }
       | GREATER_THAN{
            $$ = 2;
        }
       | GREATER_THAN_OR_EQUAL_TO{
            $$ = 3;
        }
       | EQUAL_TO{
            $$ = 4;
        }
       | NOT_EQUAL_TO{
            $$ = 5;
        }
       ;

id: ID {
    int symbolOffset = findSymbol($1);
    if(symbolOffset==-1){
        yyerror("Accessed an undefined identifier");
    }
    $$ = symbolOffset;
} | 
    id POINT ID{
    int symbolOffset = findSymbolinStruct($1,$3);
    if(symbolOffset==-1){
        yyerror("Accessed an identifier not defined in struct");
    }
    else if(!is_struct_decl($1)){
        yyerror("Member operator can only be used to access struct variables");
        symbolOffset = -1;
    }
        
    $$ = symbolOffset;
};

num:NUM{
    gen(lit, 0, $1);
};         

%%

 
int main(void)
{
	printf("Input cx file name\n");
	scanf("%s", fname);		/* 输入文件名 */

	if ((fin = fopen(fname, "r")) == NULL)
	{
		printf("Can't open the input file!\n");
		exit(1);
	}	
	if ((foutput = fopen("foutput.txt", "w")) == NULL)
    {
		printf("Can't open the output file!\n");
		exit(1);
	}
    if ((ftable = fopen("ftable.txt", "w")) == NULL)
    {
        printf("Can't open ftable.txt file!\n");
        exit(1);
    }
    if ((fcodeindex = fopen("fcodeindex.txt", "w")) == NULL)
    {
        printf("Can't open fcodeindex.txt file!\n");
        exit(1);
    }
    if ((fdebug = fopen("fdebug.txt", "w")) == NULL)
    {
        printf("Can't open fdebug.txt file!\n");
        exit(1);
    }
    fclose(fdebug);



	listswitch = 1;

    printf("debug mode?(Y/N)");	/* 是否开启调试 */
	scanf("%s", fname);
	debugswitch = (fname[0]=='y' || fname[0]=='Y');

	redirectInput(fin);		
	init();
    yyparse();
	if(err == 0)
	{
		printf("===Parsing success!===\n");
		fprintf(foutput, "===Parsing success!===\n");
        fflush(foutput);
		if ((fcode = fopen("fcode.txt", "w")) == NULL)
		{
			printf("Can't open fcode.txt file!\n");
			exit(1);
		}		

		if ((fresult = fopen("fresult.txt", "w")) == NULL)
		{
			printf("Can't open fresult.txt file!\n");
			exit(1);
		}
		
		listall();  /* 输出所有代码 */
		fclose(fcode);
        fclose(ftable);
		
		interpret();	/* 调用解释执行程序 */        	
		fclose(fresult);
	}
    else
	{
		printf("%d errors in cx program\n", err);
		fprintf(foutput, "%d errors in cx program\n", err);
	}
	
    fclose(foutput);
	fclose(fin);
    fclose(fcodeindex);
    
    return 0;
}