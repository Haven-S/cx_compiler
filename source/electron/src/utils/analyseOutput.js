function analyzeOutput(output) {
  if(!output){
    return {
      isError:false,
      errorCount:0,
      errors:[],
    }
  }
  const lines = output.split('\n');
  const errorRegex = /(.+) in line (\d+)/; // 正则表达式用于提取行号和错误信息

  let isError = false;
  let errorCount = 0;
  const errors = [];
  if (lines.at(-2).includes("errors in cx program")) {
    isError = true;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = errorRegex.exec(line);
      if (match) {
        const lineNumber = parseInt(match[2]);
        const errorMessage = match[1];
        errorCount++;
        errors.push({ line: lineNumber, message: errorMessage });
      }

    }
  }



  return {
    isError,
    errorCount,
    errors,
  };
}

export default analyzeOutput