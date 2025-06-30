import React, { useState, useEffect } from "react";
import loginBg from './fondo.jpg';
export default function FacturadorApp() {
  // Agregar junto a los otros estados
  const [enviando, setEnviando] = useState(false);
  const [mensajeEnvio, setMensajeEnvio] = useState("");
  const [errorEnvio, setErrorEnvio] = useState("");
  // Estados para autenticación
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [errorLogin, setErrorLogin] = useState("");
  const [logueado, setLogueado] = useState(false);
  
  // Estado para el menú desplegable
  const [menuAbierto, setMenuAbierto] = useState(false);
  
  // Estado para el PDF
  const [pdfUrl, setPdfUrl] = useState("");
  const [mostrarPdf, setMostrarPdf] = useState(false);
  const [cargandoPdf, setCargandoPdf] = useState(false);

  // Estados para tipo de documento (por defecto boleta)
  const [tipoDocumento, setTipoDocumento] = useState("boleta");

  // Estados para datos del cliente
  const [clienteTipoDoc, setClienteTipoDoc] = useState("1"); // Por defecto DNI para boleta
  const [clienteNumDoc, setClienteNumDoc] = useState("");
  const [clienteRazonSocial, setClienteRazonSocial] = useState("");
  const [clienteDireccion, setClienteDireccion] = useState("");
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState("");

  // Estados para productos
  const [unidad, setUnidad] = useState("NIU");
  const [codigo, setCodigo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [precio, setPrecio] = useState(0);
  const [productos, setProductos] = useState([]);

  // Estados para OpenAI Chat
  const [chatAbierto, setChatAbierto] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [mensajes, setMensajes] = useState([]);
  const [cargandoRespuesta, setCargandoRespuesta] = useState(false);

    // Estados adicionales que necesitas agregar
  const [whatsappAbierto, setWhatsappAbierto] = useState(false);
  const [numeroWhatsapp, setNumeroWhatsapp] = useState("");
  const [archivoWhatsapp, setArchivoWhatsapp] = useState(null);
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [enviandoWhatsapp, setEnviandoWhatsapp] = useState(false);
  const [mensajeWhatsapp, setMensajeWhatsapp] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    if (usuario === "admin" && contrasena === "admin123") {
      setLogueado(true);
    } else {
      setErrorLogin("Usuario o contraseña incorrectos.");
    }
  };

  const cambiarTipoDocumento = () => {
    const nuevoTipo = tipoDocumento === "boleta" ? "factura" : "boleta";
    setTipoDocumento(nuevoTipo);
    
    // Actualizar tipo de documento del cliente según el nuevo tipo
    if (nuevoTipo === "boleta") {
      setClienteTipoDoc("1"); // DNI
    } else {
      setClienteTipoDoc("6"); // RUC
    }
    
    // Limpiar datos del cliente al cambiar tipo
    setClienteNumDoc("");
    setClienteRazonSocial("");
    setClienteDireccion("");
    setErrorBusqueda("");
  };

  const cerrarSesion = () => {
    setUsuario("");
    setContrasena("");
    setLogueado(false);
    setErrorLogin("");
    setProductos([]);
    setTipoDocumento("boleta");
    setClienteTipoDoc("1");
    setMenuAbierto(false);
    setMostrarPdf(false);
    setPdfUrl("");
  };

  const buscarCliente = async () => {
    if (!clienteNumDoc) {
      setErrorBusqueda("Ingrese un número de documento");
      return;
    }
  
    // Validar longitud del documento
    if (tipoDocumento === "boleta" && clienteNumDoc.length !== 8) {
      setErrorBusqueda("El DNI debe tener 8 dígitos");
      return;
    }
  
    if (tipoDocumento === "factura" && clienteNumDoc.length !== 11) {
      setErrorBusqueda("El RUC debe tener 11 dígitos");
      return;
    }
  
    setBuscandoCliente(true);
    setErrorBusqueda("");
  
    try {
      const tipo = tipoDocumento === "boleta" ? "dni" : "ruc";
      const url = `https://api.factiliza.com/v1/${tipo}/info/${clienteNumDoc}`;
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzODg0MiIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6ImNvbnN1bHRvciJ9.4m1S0AkEpql3vBmLHjoZZWVNZ3zqMgVgQ1JtrRjcTk8"
        }
      });
  
      const data = await response.json();
  
      if (data.success) {
        if (tipoDocumento === "boleta") {
          // Para DNI - Usamos nombre_completo que viene formateado
          setClienteRazonSocial(data.data.nombre_completo || 
                              `${data.data.apellido_paterno || ''} ${data.data.apellido_materno || ''}, ${data.data.nombres || ''}`.trim());
          setClienteDireccion(data.data.direccion_completa || data.data.direccion);
        } else {
          // Para RUC - Usamos nombre_o_razon_social que es el campo correcto
          setClienteRazonSocial(data.data.nombre_o_razon_social || "");
          setClienteDireccion(data.data.direccion_completa || data.data.direccion);
        }
      } else {
        setClienteRazonSocial("");
        setClienteDireccion("");
        setErrorBusqueda(data.message || "No se encontraron resultados");
      }
    } catch (error) {
      setClienteRazonSocial("");
      setClienteDireccion("");
      setErrorBusqueda("Error al consultar la API");
      console.error("Error:", error);
    } finally {
      setBuscandoCliente(false);
    }
  };

  const handleDocumentoChange = (e) => {
    // Limitar la longitud según el tipo de documento
    const value = e.target.value;
    if (tipoDocumento === "boleta" && value.length > 8) return;
    if (tipoDocumento === "factura" && value.length > 11) return;
    
    // Solo permitir números
    if (/^\d*$/.test(value)) {
      setClienteNumDoc(value);
      setErrorBusqueda("");
    }
  };

  const agregarProducto = () => {
    if (!descripcion || cantidad <= 0 || precio <= 0) return;
    const nuevo = {
      unidad,
      codigo: codigo || "SIN-CÓDIGO",
      descripcion,
      cantidad: Number(cantidad),
      precio: Number(precio),
    };
    setProductos([...productos, nuevo]);
    setUnidad("NIU");
    setCodigo("");
    setDescripcion("");
    setCantidad(1);
    setPrecio(0);
  };

  // Calcular totales
  const calcularTotales = () => {
    let totalBase = 0;
    let totalIGV = 0;

    productos.forEach((p) => {
      const base = p.cantidad * p.precio;
      const igv = base * 0.18;
      totalBase += base;
      totalIGV += igv;
    });

    return {
      base: totalBase.toFixed(2),
      igv: totalIGV.toFixed(2),
      total: (totalBase + totalIGV).toFixed(2)
    };
  };

  const generarJSON = async () => {
    if (!clienteNumDoc || !clienteRazonSocial) {
      alert("Debe completar los datos del cliente");
      return;
    }
  
    if (productos.length === 0) {
      alert("Debe agregar al menos un producto");
      return;
    }
  
    const fecha = new Date().toISOString();
    const detalle = [];
    const { base, igv, total } = calcularTotales();
  
    productos.forEach((p) => {
      const base = +(p.cantidad * p.precio).toFixed(2);
      const igv = +(base * 0.18).toFixed(2);
      const totalUnitario = +(p.precio * 1.18).toFixed(2);
  
      detalle.push({
        unidad: p.unidad,
        cantidad: p.cantidad,
        cod_Producto: p.codigo,
        descripcion: p.descripcion,
        monto_Valor_Unitario: p.precio,
        monto_Base_Igv: base,
        porcentaje_Igv: 18,
        igv,
        tip_Afe_Igv: "10",
        total_Impuestos: igv,
        monto_Precio_Unitario: totalUnitario,
        monto_Valor_Venta: base,
        factor_Icbper: 0,
      });
    });
  
    const data = {
      tipo_Operacion: "0101",
      tipo_Doc: tipoDocumento === "boleta" ? "03" : "01",
      serie: "",
      correlativo: "",
      tipo_Moneda: "PEN",
      fecha_Emision: fecha,
      empresa_Ruc: "20607086215",
      cliente_Tipo_Doc: tipoDocumento === "boleta" ? "1" : "6",
      cliente_Num_Doc: clienteNumDoc,
      cliente_Razon_Social: clienteRazonSocial,
      cliente_Direccion: clienteDireccion,
      detalle,
      forma_pago: [
        { tipo: "Contado", monto: total, cuota: 0, fecha_Pago: fecha },
      ],
      legend: [
        { legend_Code: "1000", legend_Value: `SON ${total} CON 00/100 SOLES` },
      ],
      monto_Oper_Gravadas: base,
      monto_Igv: igv,
      total_Impuestos: igv,
      valor_Venta: base,
      sub_Total: total,
      monto_Imp_Venta: total,
      estado_Documento: "0",
      manual: false,
      id_Base_Dato: "15265",
    };
  
    // Enviar los datos al backend
    try {
      setEnviando(true);
      setMensajeEnvio("");
      setErrorEnvio("");

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        setErrorEnvio("Error de conexión con el servidor");
        setEnviando(false);
      }, 4500);
  
      const response = await fetch("https://backend-facturador.rj.r.appspot.com/facturador/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        signal: controller.signal
      });
  
      clearTimeout(timeoutId);
      
      const result = await response.json();
  
      if (response.ok) {
        setMensajeEnvio(`Documento ${tipoDocumento === "boleta" ? "Boleta" : "Factura"} generado correctamente`);
        setProductos([]);
        setClienteNumDoc("");
        setClienteRazonSocial("");
        setClienteDireccion("");
      } else {
        setErrorEnvio(result.message || "Error al generar el documento");
      }
    } catch (error) {
      console.error("Error al enviar:", error);
      setErrorEnvio("Error de conexión con el servidor");
    } finally {
      setEnviando(false);
    }
  };

  const eliminarProducto = (index) => {
    const nuevosProductos = [...productos];
    nuevosProductos.splice(index, 1);
    setProductos(nuevosProductos);
  };

  const enviarMensaje = async (e) => {
    e.preventDefault();
    if (!mensaje.trim()) return;
  
    const nuevoMensaje = {
      id: Date.now(),
      texto: mensaje,
      usuario: true
    };
  
    setMensajes([...mensajes, nuevoMensaje]);
    setMensaje("");
    setCargandoRespuesta(true);
  
    try {
      // 🔐 Obtener API Key desde el backend
      const apiKeyRes = await fetch("https://backend-facturador.rj.r.appspot.com/facturador/apikey"); // cambia el host si estás en producción
      const apiKeyData = await apiKeyRes.json();
      const apiKey = apiKeyData.apikey;
  
      const assistantId = "asst_lJIL9qCSsoZVXnFViAHX4Hzn";
  
      const headers = {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "assistants=v2"
      };
  
      // 1. Crear thread
      const threadRes = await fetch("https://api.openai.com/v1/threads", {
        method: "POST",
        headers
      });
  
      const thread = await threadRes.json();
  
      // 2. Enviar mensaje del usuario
      await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          role: "user",
          content: mensaje
        })
      });
  
      // 3. Ejecutar el assistant
      const runRes = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          assistant_id: assistantId
        })
      });
  
      const run = await runRes.json();
  
      // 4. Esperar a que se complete la ejecución
      let completed = false;
      let runStatus;
  
      while (!completed) {
        const statusRes = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}`, {
          method: "GET",
          headers
        });
  
        runStatus = await statusRes.json();
        if (runStatus.status === "completed") {
          completed = true;
        } else {
          await new Promise(res => setTimeout(res, 1000));
        }
      }
  
      // 5. Obtener los mensajes del assistant
      const messagesRes = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
        method: "GET",
        headers
      });
  
      const messagesData = await messagesRes.json();
      const respuestaIA = messagesData.data.find(msg => msg.role === "assistant");
  
      setMensajes(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          texto: respuestaIA?.content?.[0]?.text?.value || "⚠️ No se recibió respuesta del assistant.",
          usuario: false
        }
      ]);
  
    } catch (error) {
      console.error("Error al conectar con el assistant de OpenAI:", error);
      setMensajes(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          texto: "❌ Ocurrió un error al obtener respuesta del asistente.",
          usuario: false
        }
      ]);
    } finally {
      setCargandoRespuesta(false);
    }
  };
  
  

  const generarPDF = () => {
    setCargandoPdf(true);
    setMostrarPdf(false);
    setPdfUrl("");
  
    fetch("https://backend-facturador.rj.r.appspot.com/facturador/devolver", {
      method: "GET",
    })
      .then((response) => {
        if (response.ok) {
          return response.blob();
        } else {
          return response.json().then((errorData) => {
            throw new Error(errorData.message || "Error desconocido");
          });
        }
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        
        // Detectar si es móvil
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
          // Para móviles: forzar descarga
          const link = document.createElement('a');
          link.href = url;
          link.download = 'documento.pdf';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          // Para desktop: mostrar en el visor
          setPdfUrl(url);
          setMostrarPdf(true);
        }
        
        // Liberar memoria después de 1 minuto
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      })
      .catch((error) => {
        console.error("Error al generar PDF:", error);
        alert("Error al generar el PDF: " + error.message);
      })
      .finally(() => {
        setCargandoPdf(false);
      });
  };

  const { base, igv, total } = calcularTotales();

  // Función para enviar por WhatsApp
  const enviarPorWhatsapp = async () => {
    if (!numeroWhatsapp || !archivoWhatsapp) {
      setMensajeWhatsapp("Debes ingresar un número y seleccionar un archivo");
      return;
    }

    if (!numeroWhatsapp.startsWith("51") || numeroWhatsapp.length !== 11) {
      setMensajeWhatsapp("El número debe empezar con 51 y tener 11 dígitos");
      return;
    }

    setEnviandoWhatsapp(true);
    setMensajeWhatsapp("");

    try {
      // Convertir archivo a base64
      const reader = new FileReader();
      reader.readAsDataURL(archivoWhatsapp);
      reader.onload = async () => {
        const base64Media = reader.result.split(',')[1];
        
        const options = {
          method: 'POST',
          headers: {
            Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzODg0MiIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6ImNvbnN1bHRvciJ9.IhH9bpi5lvjDgflrvh1Ry5crQz-yMYBucUNsTfy6KRs',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            number: numeroWhatsapp,
            mediatype: "document",
            filename: nombreArchivo.endsWith('.pdf') ? nombreArchivo : `${nombreArchivo}.pdf`,
            media: base64Media,
            caption: "documento electronico, gracias por su compra"
          })
        };
        const encodedNumber = encodeURIComponent(numeroWhatsapp);
        const response = await fetch(`https://apiwsp.factiliza.com/v1/message/sendmedia/NTE5MjE0MjA3NTk%3D`, options);
        const result = await response.json();
        if (response.ok) {
          setMensajeWhatsapp("Documento enviado correctamente");
          setArchivoWhatsapp(null);
          setNombreArchivo("");
        } else {
          setMensajeWhatsapp(result.message || "Error al enviar el documento");
        }
      };
    } catch (error) {
      console.error("Error:", error);
      setMensajeWhatsapp("Error al enviar el documento");
    } finally {
      setEnviandoWhatsapp(false);
    }
  };
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '100%', margin: '0', display: 'flex', minHeight: '100vh' }}>
      {!logueado ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          width: '100%',
          backgroundImage: `url(${loginBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}>
          <form 
            onSubmit={handleLogin}
            style={{
              padding: '2rem',
              borderRadius: '12px',
              width: '300px',
              background: 'rgba(255, 255, 255, 0.2)', // fondo semitransparente
              backdropFilter: 'blur(10px)',           // efecto de desenfoque
              WebkitBackdropFilter: 'blur(10px)',     // compatibilidad con Safari
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
            }}
          >
            <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Iniciar Sesión</h2>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Usuario:</label>
              <input
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Contraseña:</label>
              <input
                type="password"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                width: 'auto',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem',
                display: 'block',
                margin: '0 auto' // esto lo centra horizontalmente
              }}
            >
              Ingresar
            </button>
            {errorLogin && <p style={{ color: 'red', marginTop: '1rem', textAlign: 'center' }}>{errorLogin}</p>}
          </form>
        </div>
      ) : (
        <>
          {/* Menú lateral */}
          <div style={{
            width: menuAbierto ? '250px' : '0',
            backgroundColor: '#2c3e50',
            color: 'white',
            transition: 'width 0.3s ease',
            overflow: 'hidden',
            position: 'fixed',
            height: '100vh',
            zIndex: 1000
          }}>
            <div style={{ padding: '20px', display: menuAbierto ? 'block' : 'none' }}>
              <h2 style={{ color: 'white', textAlign: 'center', marginBottom: '30px' }}>Menú</h2>
              
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '10px',
                marginBottom: '30px'
              }}>
                <button
                  onClick={() => setMostrarPdf(false)}
                  style={{
                    padding: '12px',
                    backgroundColor: '#3498db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <span>🏠</span> Home
                </button>
                
                <button
                  onClick={generarPDF}
                  disabled={cargandoPdf}
                  style={{
                    padding: '12px',
                    backgroundColor: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    opacity: cargandoPdf ? 0.7 : 1
                  }}
                >
                  {cargandoPdf ? (
                    <span>⏳ Cargando...</span>
                  ) : (
                    <>
                      <span>📄</span> Generar PDF
                    </>
                  )}
                </button>
              </div>
              
              <button
                onClick={cerrarSesion}
                style={{
                  padding: '12px',
                  backgroundColor: '#c0392b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  width: '100%',
                  marginTop: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  justifyContent: 'center'
                }}
              >
                <span>🚪</span> Cerrar Sesión
              </button>
            </div>
          </div>
          
          {/* Contenido principal */}
          <div style={{
            flex: 1,
            padding: '20px',
            marginLeft: menuAbierto ? '250px' : '0',
            transition: 'margin-left 0.3s ease',
            width: menuAbierto ? 'calc(100% - 250px)' : '100%'
          }}>
            {/* Botón para abrir/cerrar menú */}
            <button
              onClick={() => setMenuAbierto(!menuAbierto)}
              style={{
                position: 'fixed',
                left: menuAbierto ? '250px' : '0',
                top: '10px',
                zIndex: 1001,
                padding: '10px',
                backgroundColor: '#2c3e50',
                color: 'white',
                border: 'none',
                borderRadius: '0 5px 5px 0',
                cursor: 'pointer',
                transition: 'left 0.3s ease',
                fontSize: '1.2rem'
              }}
            >
              {menuAbierto ? '◄' : '►'}
            </button>
            
            {mostrarPdf ? (
              <div style={{ width: '100%', height: '90vh' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Vista Previa del PDF</h2>
                {pdfUrl ? (
                  <iframe 
                    src={pdfUrl} 
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    title="Vista previa del PDF"
                  />
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    height: '100%',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '8px'
                  }}>
                    <p>No hay PDF para mostrar</p>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: '20px',
                  flexWrap: 'wrap',
                  gap: '10px',
                  paddingLeft: '20px',
                }}>
                  <h2 style={{ margin: 0 }}>
                    {tipoDocumento === "boleta" ? "Boleta de Venta" : "Factura"}
                    <span style={{ 
                      fontSize: '0.8rem',
                      backgroundColor: tipoDocumento === "boleta" ? '#2196F3' : '#4CAF50',
                      color: 'white',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      marginLeft: '10px'
                    }}>
                      {tipoDocumento.toUpperCase()}
                    </span>
                  </h2>
                  
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={cambiarTipoDocumento}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#FF9800',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Cambiar a {tipoDocumento === "boleta" ? "Factura" : "Boleta"}
                    </button>
                  </div>
                </div>


                <div style={{ 
                  backgroundColor: '#f9f9f9', 
                  padding: '20px', 
                  borderRadius: '8px',
                  marginBottom: '20px'
                }}>
                  <h3 style={{ marginTop: 0 }}>Datos del Cliente</h3>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '15px',
                    marginBottom: '15px'
                  }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px' }}>Tipo de Documento</label>
                      <div style={{
                        padding: '8px',
                        backgroundColor: '#eee',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontWeight: 'bold'
                      }}>
                        {tipoDocumento === "boleta" ? "DNI" : "RUC"}
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px' }}>
                        {tipoDocumento === "boleta" ? "DNI" : "RUC"}
                      </label>
                      <input
                        type="text"
                        placeholder={tipoDocumento === "boleta" ? "Ingrese DNI (8 dígitos)" : "Ingrese RUC (11 dígitos)"}
                        value={clienteNumDoc}
                        onChange={handleDocumentoChange}
                        maxLength={tipoDocumento === "boleta" ? 8 : 11}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          marginBottom: '5px'
                        }}
                      />
                      <button
                        onClick={buscarCliente}
                        disabled={buscandoCliente}
                        style={{
                          width: '100%',
                          padding: '8px',
                          backgroundColor: '#2196F3',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px'
                        }}
                        title="Buscar datos del cliente"
                      >
                        {buscandoCliente ? (
                          <>
                            <span>⏳</span>
                            <span>Buscando...</span>
                          </>
                        ) : (
                          <>
                            <span>🔍</span>
                            <span>Buscar</span>
                          </>
                        )}
                      </button>
                      {errorBusqueda && (
                        <p style={{ color: 'red', fontSize: '0.8rem', marginTop: '5px' }}>
                          {errorBusqueda}
                        </p>
                      )}
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', marginBottom: '5px' }}>Razón Social/Nombre</label>
                      <input
                        type="text"
                        placeholder="Nombre o Razón Social del cliente"
                        value={clienteRazonSocial || ""}
                        onChange={(e) => setClienteRazonSocial(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', marginBottom: '5px' }}>Dirección</label>
                      <input
                        type="text"
                        placeholder="Dirección del cliente"
                        value={clienteDireccion || ""}
                        onChange={(e) => setClienteDireccion(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ 
                  backgroundColor: '#f9f9f9', 
                  padding: '20px', 
                  borderRadius: '8px',
                  marginBottom: '20px'
                }}>
                  <h3 style={{ marginTop: 0 }}>Agregar producto</h3>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: '15px',
                    marginBottom: '15px'
                  }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px' }}>Unidad</label>
                      <input
                        type="text"
                        placeholder="Ej: NIU"
                        value={unidad}
                        onChange={(e) => setUnidad(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px' }}>Código</label>
                      <input
                        type="text"
                        placeholder="Código del producto"
                        value={codigo}
                        onChange={(e) => setCodigo(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px' }}>Descripción</label>
                      <input
                        type="text"
                        placeholder="Nombre del producto"
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px' }}>Cantidad</label>
                      <input
                        type="number"
                        min="1"
                        value={cantidad}
                        onChange={(e) => setCantidad(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px' }}>Precio Unitario (S/)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={precio}
                        onChange={(e) => setPrecio(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={agregarProducto}
                    style={{
                      padding: '10px 15px',
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '1rem'
                    }}
                  >
                    Agregar Producto
                  </button>
                </div>

                {productos.length > 0 && (
                  <>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ 
                        width: '100%', 
                        borderCollapse: 'collapse',
                        marginBottom: '20px'
                      }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f2f2f2' }}>
                            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Unidad</th>
                            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Código</th>
                            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Descripción</th>
                            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Cantidad</th>
                            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Precio Unitario</th>
                            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Subtotal</th>
                            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {productos.map((p, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #ddd' }}>
                              <td style={{ padding: '12px', border: '1px solid #ddd' }}>{p.unidad}</td>
                              <td style={{ padding: '12px', border: '1px solid #ddd' }}>{p.codigo}</td>
                              <td style={{ padding: '12px', border: '1px solid #ddd' }}>{p.descripcion}</td>
                              <td style={{ padding: '12px', border: '1px solid #ddd' }}>{p.cantidad}</td>
                              <td style={{ padding: '12px', border: '1px solid #ddd' }}>S/ {p.precio.toFixed(2)}</td>
                              <td style={{ padding: '12px', border: '1px solid #ddd' }}>S/ {(p.cantidad * p.precio).toFixed(2)}</td>
                              <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                                <button 
                                  onClick={() => eliminarProducto(i)}
                                  style={{
                                    padding: '5px 10px',
                                    backgroundColor: '#f44336',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Eliminar
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div style={{ 
                      backgroundColor: '#f9f9f9', 
                      padding: '20px', 
                      borderRadius: '8px',
                      marginBottom: '20px'
                    }}>
                      <h3 style={{ marginTop: 0 }}>Totales</h3>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '15px'
                      }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Subtotal:</label>
                          <div style={{
                            padding: '10px',
                            backgroundColor: 'white',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontWeight: 'bold'
                          }}>
                            S/ {base}
                          </div>
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>IGV (18%):</label>
                          <div style={{
                            padding: '10px',
                            backgroundColor: 'white',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontWeight: 'bold'
                          }}>
                            S/ {igv}
                          </div>
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Total a Pagar:</label>
                          <div style={{
                            padding: '10px',
                            backgroundColor: '#e8f5e9',
                            border: '1px solid #4CAF50',
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            color: '#2e7d32'
                          }}>
                            S/ {total}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <button
                          onClick={generarJSON}
                          disabled={enviando}
                          style={{
                            padding: '12px 24px',
                            backgroundColor: '#2196F3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            opacity: enviando ? 0.7 : 1
                          }}
                        >
                          {enviando ? (
                            "Enviando..."
                          ) : (
                            `🧾 Generar ${tipoDocumento === "boleta" ? "Boleta" : "Factura"}`
                          )}
                        </button>
                        
                        {mensajeEnvio && (
                          <div style={{
                            marginTop: '15px',
                            padding: '10px',
                            backgroundColor: '#e8f5e9',
                            color: '#2e7d32',
                            borderRadius: '4px'
                          }}>
                            {mensajeEnvio}
                          </div>
                        )}
                        
                        {errorEnvio && (
                          <div style={{
                            marginTop: '15px',
                            padding: '10px',
                            backgroundColor: '#ffebee',
                            color: '#c62828',
                            borderRadius: '4px'
                          }}>
                            Error: {errorEnvio}
                          </div>
                        )}
                      </div>
                  </>
                )}
              </>
            )}
          </div>
        </>
      )}
      {/* Botón flotante de OpenAI */}
      {logueado && (
        <div style={{
          position: 'fixed',
          right: '20px',
          bottom: '20px',
          zIndex: 1000
        }}>
          <button
            onClick={() => setChatAbierto(!chatAbierto)}
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: '#10a37f',
              border: 'none',
              boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              transition: 'transform 0.2s'
            }}
            title="Asistente de IA"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="white">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12z"/>
              <path d="M6 10h2v2H6zm0 4h2v2H6zm4-4h8v2h-8zm0 4h5v2h-5z"/>
            </svg>
          </button>
          
          {/* Chat de OpenAI */}
          {chatAbierto && (
            <div style={{
              position: 'fixed',
              right: '20px',
              bottom: '90px',
              width: '350px',
              height: '500px',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              zIndex: 1001
            }}>
              {/* Encabezado del chat */}
              <div style={{
                backgroundColor: '#10a37f',
                color: 'white',
                padding: '15px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12z"/>
                    <path d="M6 10h2v2H6zm0 4h2v2H6zm4-4h8v2h-8zm0 4h5v2h-5z"/>
                  </svg>
                  <span style={{ fontWeight: 'bold' }}>Asistente de IA</span>
                </div>
                <button 
                  onClick={() => setChatAbierto(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  ×
                </button>
              </div>
              
              {/* Área de mensajes */}
              <div style={{
                flex: 1,
                padding: '15px',
                overflowY: 'auto',
                backgroundColor: '#f7f7f8',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px'
              }}>
                {mensajes.length === 0 ? (
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center',
                    color: '#6e6e80'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="#10a37f">
                      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12z"/>
                      <path d="M6 10h2v2H6zm0 4h2v2H6zm4-4h8v2h-8zm0 4h5v2h-5z"/>
                    </svg>
                    <p style={{ marginTop: '10px' }}>¿En qué puedo ayudarte con el sistema de facturación?</p>
                  </div>
                ) : (
                  mensajes.map(msg => (
                    <div key={msg.id} style={{
                      alignSelf: msg.usuario ? 'flex-end' : 'flex-start',
                      maxWidth: '80%',
                      padding: '10px 15px',
                      borderRadius: msg.usuario ? '18px 18px 0 18px' : '18px 18px 18px 0',
                      backgroundColor: msg.usuario ? '#10a37f' : '#e5e5ea',
                      color: msg.usuario ? 'white' : 'black',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}>
                      {msg.texto}
                    </div>
                  ))
                )}
                {cargandoRespuesta && (
                  <div style={{
                    alignSelf: 'flex-start',
                    padding: '10px 15px',
                    borderRadius: '18px 18px 18px 0',
                    backgroundColor: '#e5e5ea',
                    color: 'black',
                    display: 'flex',
                    gap: '5px'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#6e6e80',
                      animation: 'bounce 1s infinite'
                    }}></div>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#6e6e80',
                      animation: 'bounce 1s infinite 0.2s'
                    }}></div>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#6e6e80',
                      animation: 'bounce 1s infinite 0.4s'
                    }}></div>
                  </div>
                )}
              </div>
              
              {/* Formulario de mensaje */}
              <form onSubmit={enviarMensaje} style={{
                padding: '15px',
                borderTop: '1px solid #e5e5ea',
                backgroundColor: 'white'
              }}>
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'center'
                }}>
                  <input
                    type="text"
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    placeholder="Escribe tu mensaje..."
                    style={{
                      flex: 1,
                      padding: '10px 15px',
                      border: '1px solid #e5e5ea',
                      borderRadius: '20px',
                      outline: 'none',
                      fontSize: '14px'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!mensaje.trim() || cargandoRespuesta}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: '#10a37f',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      opacity: !mensaje.trim() ? 0.5 : 1
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                    </svg>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {logueado && (
        <>
          {/* Botón de WhatsApp IMPORTANTE */}
          <div style={{
            position: 'fixed',
            left: '20px',
            bottom: '20px',
            zIndex: 1000
          }}>
            <button
              onClick={() => setWhatsappAbierto(!whatsappAbierto)}
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: '#25D366',
                border: 'none',
                boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                transition: 'transform 0.2s'
              }}
              title="Enviar por WhatsApp"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </button>
            
            {/* Ventana de WhatsApp */}
            {whatsappAbierto && (
              <div style={{
                position: 'fixed',
                left: '20px',
                bottom: '90px',
                width: '350px',
                height: 'auto',
                maxHeight: '500px',
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                zIndex: 1001,
                padding: '15px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '15px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#25D366">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    <span style={{ fontWeight: 'bold' }}>Enviar documento</span>
                  </div>
                  <button 
                    onClick={() => setWhatsappAbierto(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#666',
                      cursor: 'pointer',
                      fontSize: '16px'
                    }}
                  >
                    ×
                  </button>
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    Número de WhatsApp (ej: 51921420759)
                  </label>
                  <input
                    type="text"
                    placeholder="51921420759"
                    value={numeroWhatsapp}
                    onChange={(e) => setNumeroWhatsapp(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                
                <div 
                  style={{
                    border: '2px dashed #25D366',
                    borderRadius: '8px',
                    padding: '20px',
                    textAlign: 'center',
                    marginBottom: '15px',
                    backgroundColor: archivoWhatsapp ? '#e8f5e9' : 'transparent',
                    transition: 'background-color 0.3s'
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.backgroundColor = '#e8f5e9';
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    if (!archivoWhatsapp) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.backgroundColor = '#e8f5e9';
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      const file = e.dataTransfer.files[0];
                      if (file.type === 'application/pdf') {
                        setArchivoWhatsapp(file);
                        setNombreArchivo(file.name);
                      } else {
                        setMensajeWhatsapp("Solo se permiten archivos PDF");
                      }
                    }
                  }}
                >
                  {archivoWhatsapp ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#25D366">
                          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
                        </svg>
                        <span style={{ fontWeight: '500' }}>{nombreArchivo}</span>
                      </div>
                      <button 
                        onClick={() => {
                          setArchivoWhatsapp(null);
                          setNombreArchivo("");
                        }}
                        style={{
                          marginTop: '10px',
                          padding: '5px 10px',
                          backgroundColor: '#ff4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Eliminar archivo
                      </button>
                    </div>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="#25D366" style={{ marginBottom: '10px' }}>
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                      </svg>
                      <p style={{ margin: '10px 0', color: '#555' }}>Arrastra un archivo PDF aquí o haz clic para seleccionar</p>
                      <input
                        type="file"
                        id="whatsapp-file-input"
                        accept=".pdf"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            setArchivoWhatsapp(file);
                            setNombreArchivo(file.name);
                          }
                        }}
                      />
                      <button
                        onClick={() => document.getElementById('whatsapp-file-input').click()}
                        style={{
                          padding: '8px 15px',
                          backgroundColor: '#25D366',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        Seleccionar archivo
                      </button>
                    </>
                  )}
                </div>
                
                {mensajeWhatsapp && (
                  <div style={{
                    padding: '10px',
                    backgroundColor: mensajeWhatsapp.includes("correctamente") ? '#e8f5e9' : '#ffebee',
                    color: mensajeWhatsapp.includes("correctamente") ? '#2e7d32' : '#c62828',
                    borderRadius: '4px',
                    marginBottom: '15px',
                    fontSize: '14px'
                  }}>
                    {mensajeWhatsapp}
                  </div>
                )}
                
                <button
                  onClick={enviarPorWhatsapp}
                  disabled={!numeroWhatsapp || !archivoWhatsapp || enviandoWhatsapp}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#25D366',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '500',
                    opacity: (!numeroWhatsapp || !archivoWhatsapp) ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {enviandoWhatsapp ? (
                    <>
                      <div style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                      </svg>
                      Enviar documento
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}