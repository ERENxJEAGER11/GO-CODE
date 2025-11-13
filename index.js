// --------------------------
    //  Mini SAIL Engine
    // --------------------------
    let state = {}; // holds values for saveInto tracking

    function a_formLayout(config) {
      return { type: "formLayout", props: config };
    }

    function a_textField(config) {
      return { type: "textField", props: config };
    }

    function a_dropdownField(config) {
      return { type: "dropdownField", props: config };
    }

    function a_buttonWidget(config) {
      return { type: "buttonWidget", props: config };
    }

    function a_if(condition, component) {
      return condition ? component : null;
    }

    // --- Renderer ---
    function renderSAIL(node, parentPath = "") {
      if (!node) return document.createTextNode("");
      let el;

      switch (node.type) {
        case "formLayout":
          el = document.createElement("div");
          el.className = "formLayout";
          if (node.props.label) {
            const h2 = document.createElement("h2");
            h2.textContent = node.props.label;
            el.appendChild(h2);
          }
          (node.props.contents || []).forEach((child, i) => {
            el.appendChild(renderSAIL(child, parentPath + ".contents[" + i + "]"));
          });
          break;

        case "textField":
          el = document.createElement("div");
          el.className = "textField";
          const label = document.createElement("label");
          label.textContent = node.props.label;
          const input = document.createElement("input");
          input.type = "text";
          input.value = state[node.props.saveInto] || node.props.value || "";
          input.addEventListener("input", e => {
            state[node.props.saveInto] = e.target.value;
            renderApp(); // reactive update
          });
          el.appendChild(label);
          el.appendChild(input);
          break;

        case "dropdownField":
          el = document.createElement("div");
          el.className = "dropdownField";
          const dlabel = document.createElement("label");
          dlabel.textContent = node.props.label;
          const select = document.createElement("select");
          (node.props.choices || []).forEach(opt => {
            const option = document.createElement("option");
            option.value = opt.value;
            option.textContent = opt.label;
            if (opt.value === state[node.props.saveInto]) option.selected = true;
            select.appendChild(option);
          });
          select.addEventListener("change", e => {
            state[node.props.saveInto] = e.target.value;
            renderApp();
          });
          el.appendChild(dlabel);
          el.appendChild(select);
          break;

        case "buttonWidget":
          el = document.createElement("button");
          el.textContent = node.props.label;
          el.addEventListener("click", () => {
            alert("Button clicked! Current state:\n" + JSON.stringify(state, null, 2));
          });
          break;

        default:
          el = document.createTextNode("Unknown: " + node.type);
      }
      return el;
    }

    // --------------------------
    //  Playground logic
    // --------------------------
    const editor = document.getElementById("editor");
    const ui = document.getElementById("ui");
    const json = document.getElementById("json");

    editor.value = `a_formLayout({
  label: "User Form",
  contents: [
    a_textField({ 
      label: "Name", 
      value: "John Doe", 
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
    a_if(state.role === "admin", 
      a_textField({ 
        label: "Admin Code", 
        value: "", 
        saveInto: "code" 
      })
    ),
    a_buttonWidget({ label: "Submit" })
  ]
})`;

    function evaluateSAIL() {
      try {
        const func = new Function("a_formLayout","a_textField","a_buttonWidget","a_dropdownField","a_if","state","return " + editor.value);
        const ast = func(a_formLayout, a_textField, a_buttonWidget, a_dropdownField, a_if, state);
        return ast;
      } catch (err) {
        return { type: "error", error: err.message };
      }
    }

    function renderApp() {
      const ast = evaluateSAIL();
      ui.innerHTML = "";
      if (ast.type === "error") {
        ui.innerHTML = "<pre style='color:red'>" + ast.error + "</pre>";
        return;
      }
      const domModel = JSON.parse(JSON.stringify(ast)); // simple clone
      ui.appendChild(renderSAIL(ast));
      json.textContent = "AST:\n" + JSON.stringify(ast, null, 2) +
                         "\n\nSTATE:\n" + JSON.stringify(state, null, 2);
    }

    editor.addEventListener("input", renderApp);
    renderApp();