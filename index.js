// ----------------------
// Collapsible sections
function toggleSection(id){
  const section = document.getElementById(id);
  section.classList.toggle('collapsed');
}

// ----------------------
// Resizable panes
const divider = document.getElementById('divider');
const leftPane = document.getElementById('leftPane');
divider.onmousedown = function(e){
  e.preventDefault();
  document.onmousemove = function(e){
    let newWidth = e.clientX;
    if(newWidth<200) newWidth=200;
    if(newWidth>window.innerWidth-200) newWidth=window.innerWidth-200;
    leftPane.style.width=newWidth+'px';
  }
  document.onmouseup = function(){ document.onmousemove=null; document.onmouseup=null; }
}

// Vertical resizer for top/bottom sections
function makeVResizer(resizerId, topId, bottomId){
  const resizer = document.getElementById(resizerId);
  const top = document.getElementById(topId);
  const bottom = document.getElementById(bottomId);
  resizer.onmousedown = function(e){
    e.preventDefault();
    document.onmousemove = function(e){
      const container = top.parentNode.getBoundingClientRect();
      const topHeight = e.clientY - container.top;
      const bottomHeight = container.bottom - e.clientY;
      if(topHeight<50 || bottomHeight<50) return;
      top.style.flex='none';
      top.style.height=topHeight+'px';
      bottom.style.flex='none';
      bottom.style.height=bottomHeight+'px';
    }
    document.onmouseup = function(){ document.onmousemove=null; document.onmouseup=null; }
  }
}
makeVResizer('leftResizer','editorSection','docsSection');
makeVResizer('rightResizer','renderSection','astSection');

// ----------------------
// Mini SAIL Engine
let state = {};
let astHistory = [];

function a_formLayout(config){ return { type:"formLayout", props:config }; }
function a_textField(config){ return { type:"textField", props:config }; }
function a_dropdownField(config){ return { type:"dropdownField", props:config }; }
function a_buttonWidget(config){ return { type:"buttonWidget", props:config }; }
function a_if(condition, component){ return condition ? component : null; }

function renderSAIL(node){
  if(!node) return document.createTextNode("");
  let el;
  switch(node.type){
    case "formLayout":
      el=document.createElement("div"); el.className="formLayout";
      if(node.props.label){ const h2=document.createElement("h2"); h2.textContent=node.props.label; el.appendChild(h2);}
      (node.props.contents||[]).forEach(child=>{ el.appendChild(renderSAIL(child)); });
      break;
    case "textField":
      el=document.createElement("div"); el.className="textField";
      const label=document.createElement("label"); label.textContent=node.props.label;
      const input=document.createElement("input"); input.type="text";
      input.value=state[node.props.saveInto]||node.props.value||"";
      input.addEventListener("input",e=>{ state[node.props.saveInto]=e.target.value; renderApp(); });
      el.appendChild(label); el.appendChild(input);
      break;
    case "dropdownField":
      el=document.createElement("div"); el.className="dropdownField";
      const dlabel=document.createElement("label"); dlabel.textContent=node.props.label;
      const select=document.createElement("select");
      (node.props.choices||[]).forEach(opt=>{
        const option=document.createElement("option"); option.value=opt.value; option.textContent=opt.label;
        if(opt.value===state[node.props.saveInto]) option.selected=true;
        select.appendChild(option);
      });
      select.addEventListener("change",e=>{ state[node.props.saveInto]=e.target.value; renderApp(); });
      el.appendChild(dlabel); el.appendChild(select);
      break;
    case "buttonWidget":
      el=document.createElement("button"); el.textContent=node.props.label;
      el.addEventListener("click",()=>{ alert("Button clicked!\n"+JSON.stringify(state,null,2)); });
      break;
    default: el=document.createTextNode("Unknown: "+node.type);
  }
  return el;
}

// ----------------------
// Playground logic
const editor=document.getElementById("editor");
const ui=document.getElementById("ui");
const json=document.getElementById("json");
const functionDocs=document.getElementById("functionDocs");

const funcs = [
  {name:"a_formLayout", desc:"Creates a form layout", params:"config: {label:string, contents:Array}"},
  {name:"a_textField", desc:"Creates a text field", params:"config: {label:string, value:string, saveInto:string}"},
  {name:"a_dropdownField", desc:"Creates a dropdown field", params:"config: {label:string, choices:Array<{label,value}>, saveInto:string}"},
  {name:"a_buttonWidget", desc:"Creates a button", params:"config: {label:string}"},
  {name:"a_if", desc:"Conditional render", params:"condition:boolean, component:SAILNode"}
];

functionDocs.innerHTML=funcs.map(f=>`
<div class="funcDoc">
  <div class="funcDoc-header" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='block'?'none':'block'">${f.name}</div>
  <div class="funcDoc-content">
    <strong>Description:</strong> ${f.desc}<br>
    <strong>Parameters:</strong> ${f.params}
  </div>
</div>`).join('');

editor.value = `a_formLayout({
  label: "User Form",
  contents: [
    a_textField({
      label: "Name",
      value: "Aman Shekh",
      saveInto: "name"
    }),
    a_dropdownField({
      label: "Role",
      choices: [
        { label: "Admin", value: "admin" },
        { label: "User", value: "user" }
      ],
      saveInto: "role"
    }),
    a_if(
      state.role === "admin",
      a_textField({
        label: "Admin Code",
        value: "",
        saveInto: "code"
      })
    ),
    a_buttonWidget({
      label: "Submit"
    })
  ]
});
`;

function evaluateSAIL(){
  try{
    const func = new Function("a_formLayout","a_textField","a_buttonWidget","a_dropdownField","a_if","state","return "+editor.value);
    const ast = func(a_formLayout, a_textField, a_buttonWidget, a_dropdownField, a_if, state);
    return ast;
  }catch(err){ return {type:"error",error:err.message}; }
}

function renderApp(){
  const ast = evaluateSAIL();
  ui.innerHTML="";
  if(ast.type==="error"){ ui.innerHTML="<pre style='color:red'>"+ast.error+"</pre>"; return; }
  ui.appendChild(renderSAIL(ast));

  astHistory.push(JSON.parse(JSON.stringify(ast)));
  json.textContent="AST History:\n"+astHistory.map((a,i)=>`[${i}]: ${JSON.stringify(a,null,2)}`).join("\n\n");
}

editor.addEventListener("input", renderApp);
renderApp();