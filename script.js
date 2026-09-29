
'use strict';
const currentEl = document.getElementById('current');
const historyEl = document.getElementById('history');
const keysEl = document.querySelector('.keys');
const OPERATORS = ['+', '-', '*', '/'];
const DISPLAY_SYMBOLS = { '*': '×', '/': '÷', '-': '−', '+': '+' };

let expression = '';        
let justEvaluated = false;  
let hasError = false;       
const isOperator = (ch) => OPERATORS.includes(ch);
function getCurrentNumber() {
  const parts = expression.split(/[+\-*/]/);
  return parts[parts.length - 1];
}
function render() {
  currentEl.classList.remove('is-error');
  currentEl.textContent = expression
    ? expression.replace(/[*/\-]/g, (op) => DISPLAY_SYMBOLS[op])
    : '0';
  currentEl.scrollLeft = currentEl.scrollWidth; 
}
function showError(message) {
  hasError = true;
  expression = '';
  justEvaluated = false;
  currentEl.textContent = message;
  currentEl.classList.add('is-error');
}
function resetIfError() {
  if (hasError) {
    hasError = false;
    historyEl.textContent = '';
  }
}
function appendNumber(value) {
  resetIfError();
  if (justEvaluated) {
    expression = '';
    historyEl.textContent = '';
    justEvaluated = false;
  }

  const currentNumber = getCurrentNumber();

  if (value === '.') {
    if (currentNumber.includes('.')) return;          
    if (currentNumber === '') expression += '0';     
  } else if (currentNumber === '0') {
    expression = expression.slice(0, -1);            
  }

  expression += value;
  render();
}
function appendOperator(op) {
  resetIfError();
  justEvaluated = false; 

  if (expression === '') {
    if (op === '-') { expression = '-'; render(); }   
    return;                                           
  }

  if (expression === '-') return;                    

  const last = expression.slice(-1);
  if (isOperator(last)) {
    expression = expression.slice(0, -1) + op;        
  } else {
    expression += op;
  }
  render();
}
function clearAll() {
  expression = '';
  justEvaluated = false;
  hasError = false;
  historyEl.textContent = '';
  render();
}
function deleteLast() {
  if (hasError) { clearAll(); return; }
  if (justEvaluated) { clearAll(); return; }
  expression = expression.slice(0, -1);
  render();
}
function calculate(expr) {
  const tokens = expr.match(/\d+\.?\d*|\.\d+|[+\-*/]/g);
  if (!tokens) throw new Error('Invalid expression');
  if (tokens[0] === '-') {
    tokens.shift();
    if (tokens.length === 0 || isOperator(tokens[0])) throw new Error('Invalid expression');
    tokens[0] = '-' + tokens[0];
  }
  const list = tokens.map((t) => (isOperator(t) ? t : parseFloat(t)));
  const stack = [list[0]];
  for (let i = 1; i < list.length; i += 2) {
    const op = list[i];
    const num = list[i + 1];
    if (typeof num !== 'number' || Number.isNaN(num)) throw new Error('Invalid expression');

    if (op === '*') {
      stack.push(stack.pop() * num);
    } else if (op === '/') {
      if (num === 0) throw new Error('Cannot divide by zero');
      stack.push(stack.pop() / num);
    } else {
      stack.push(op, num); 
    }
  }
  let result = stack[0];
  for (let i = 1; i < stack.length; i += 2) {
    result = stack[i] === '+' ? result + stack[i + 1] : result - stack[i + 1];
  }

  if (!Number.isFinite(result)) throw new Error('Result too large');
  return parseFloat(result.toPrecision(12));
}
function evaluate() {
  if (hasError || expression === '') return;
  let expr = expression;
  while (expr && isOperator(expr.slice(-1))) expr = expr.slice(0, -1);
  if (expr === '' || expr === '-') { showError('Invalid expression'); return; }

  try {
    const result = calculate(expr);
    historyEl.textContent = expr.replace(/[*/\-]/g, (op) => DISPLAY_SYMBOLS[op]) + ' =';
    expression = String(result);
    justEvaluated = true;
    render();
  } catch (err) {
    historyEl.textContent = '';
    showError(err.message);
  }
}
keysEl.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;

  const { value, action } = button.dataset;

  if (action === 'clear') clearAll();
  else if (action === 'delete') deleteLast();
  else if (action === 'equals') evaluate();
  else if (isOperator(value)) appendOperator(value);
  else appendNumber(value);
});
document.addEventListener('keydown', (event) => {
  const { key } = event;
  let selector = null; 

  if (/^[0-9]$/.test(key) || key === '.') {
    appendNumber(key);
    selector = `[data-value="${key}"]`;
  } else if (isOperator(key)) {
    appendOperator(key);
    selector = `[data-value="${key}"]`;
  } else if (key === 'Enter' || key === '=') {
    event.preventDefault();
    evaluate();
    selector = '[data-action="equals"]';
  } else if (key === 'Backspace') {
    deleteLast();
    selector = '[data-action="delete"]';
  } else if (key === 'Escape' || key.toLowerCase() === 'c') {
    clearAll();
    selector = '[data-action="clear"]';
  }
  if (selector) {
    const button = document.querySelector(selector);
    if (button) {
      button.classList.add('is-pressed');
      setTimeout(() => button.classList.remove('is-pressed'), 120);
    }
  }
});

render();