import { Product, Sale, WhatsAppTemplate, DailySaleRecord } from '../types';

export const INITIAL_DAILY_RECORDS: DailySaleRecord[] = [
  {
    id: 'rec-1',
    date: '2026-08-12',
    month: 'Agosto',
    platform: 'Meta Ads (FB / IG)',
    defaultProduct: "Polera Oversize D'RAYO Heavyweight",
    dailySpend: 60.00,
    salesCount: 6,
    cpa: 10.00,
    notes: 'Campaña Meta WhatsApp Conversiones - Excelente conversión'
  },
  {
    id: 'rec-2',
    date: '2026-08-11',
    month: 'Agosto',
    platform: 'TikTok Ads',
    defaultProduct: "Zapatillas Urbanas D'RAYO Street",
    dailySpend: 80.00,
    salesCount: 5,
    cpa: 16.00,
    notes: 'Anuncio Zapatillas Urbanas Viral'
  },
  {
    id: 'rec-3',
    date: '2026-08-10',
    month: 'Agosto',
    platform: 'Meta Ads (FB / IG)',
    defaultProduct: "Camiseta Streetwear D'RAYO Graphic",
    dailySpend: 45.00,
    salesCount: 9,
    cpa: 5.00,
    notes: 'Pack Camisetas Boxy Fit'
  },
  {
    id: 'rec-4',
    date: '2026-08-09',
    month: 'Agosto',
    platform: 'Google Ads',
    defaultProduct: "Pantalón Cargo D'RAYO Tactical",
    dailySpend: 50.00,
    salesCount: 4,
    cpa: 12.50,
    notes: 'Campaña Pantalón Cargo Drill'
  },
  {
    id: 'rec-5',
    date: '2026-07-28',
    month: 'Julio',
    platform: 'Orgánico / Directo',
    defaultProduct: "Casaca Windbreaker D'RAYO Reflective",
    dailySpend: 0.00,
    salesCount: 12,
    cpa: 0.00,
    notes: 'Especial Fiestas Patrias - Estado WhatsApp & Referidos'
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p-1',
    sku: 'DRY-POL-001',
    name: "Polera Oversize D'RAYO Heavyweight",
    category: 'Ropa / Poleras',
    costPrice: 35.00,
    salePrice: 89.00,
    stock: 45,
    minStock: 10,
    notes: 'Algodón reactivo 100% 300g. Estampa serigrafía.'
  },
  {
    id: 'p-2',
    sku: 'DRY-ZAP-002',
    name: "Zapatillas Urbanas D'RAYO Street",
    category: 'Calzado',
    costPrice: 65.00,
    salePrice: 159.00,
    stock: 28,
    minStock: 8,
    notes: 'Suela antideslizante, plantilla ergonómica.'
  },
  {
    id: 'p-3',
    sku: 'DRY-CAM-003',
    name: "Camiseta Streetwear D'RAYO Graphic",
    category: 'Ropa / Polos',
    costPrice: 20.00,
    salePrice: 49.00,
    stock: 60,
    minStock: 15,
    notes: 'Corte boxy fit, cuello acanalado.'
  },
  {
    id: 'p-4',
    sku: 'DRY-CAR-004',
    name: "Pantalón Cargo D'RAYO Tactical",
    category: 'Ropa / Pantalones',
    costPrice: 40.00,
    salePrice: 119.00,
    stock: 18,
    minStock: 5,
    notes: 'Tela drill satinado con 6 bolsillos funcionales.'
  },
  {
    id: 'p-5',
    sku: 'DRY-GOR-005',
    name: "Gorra Snapback D'RAYO Classic",
    category: 'Accesorios',
    costPrice: 12.00,
    salePrice: 35.00,
    stock: 30,
    minStock: 10,
    notes: 'Bordado 3D frontal, broche ajustable.'
  },
  {
    id: 'p-6',
    sku: 'DRY-CAS-006',
    name: "Casaca Windbreaker D'RAYO Reflective",
    category: 'Casacas',
    costPrice: 55.00,
    salePrice: 149.00,
    stock: 12,
    minStock: 5,
    notes: 'Corta vientos e impermeable con detalles reflectivos.'
  }
];

export const INITIAL_SALES: Sale[] = [
  {
    id: 'VEN-2026-081',
    customerName: 'Carlos Mendoza',
    customerPhone: '+51 987654321',
    customerEmail: 'carlos.mendoza@gmail.com',
    city: 'Lima',
    date: '2026-06-28',
    time: '14:30',
    items: [
      { productId: 'p-1', productName: "Polera Oversize D'RAYO Heavyweight", quantity: 1, unitPrice: 89.00, costPrice: 35.00 },
      { productId: 'p-5', productName: "Gorra Snapback D'RAYO Classic", quantity: 1, unitPrice: 35.00, costPrice: 12.00 }
    ],
    subtotal: 124.00,
    shippingCost: 10.00,
    total: 134.00,
    paymentMethod: 'Yape',
    status: 'Entregada',
    metaEventExported: true,
    notes: 'Cliente de anuncio Instagram WhatsApp. Entrega Olva Courier.'
  },
  {
    id: 'VEN-2026-080',
    customerName: 'Valeria Quispe',
    customerPhone: '+51 912345678',
    customerEmail: 'valeria.q@hotmail.com',
    city: 'Arequipa',
    date: '2026-06-25',
    time: '18:15',
    items: [
      { productId: 'p-2', productName: "Zapatillas Urbanas D'RAYO Street", quantity: 1, unitPrice: 159.00, costPrice: 65.00 }
    ],
    subtotal: 159.00,
    shippingCost: 15.00,
    total: 174.00,
    paymentMethod: 'Plin',
    status: 'Entregada',
    metaEventExported: true,
    notes: 'Preguntó por catálogo en WhatsApp.'
  },
  {
    id: 'VEN-2026-079',
    customerName: 'Mateo Flores',
    customerPhone: '+51 954321876',
    customerEmail: 'mflores@outlook.com',
    city: 'Trujillo',
    date: '2026-06-23',
    time: '11:20',
    items: [
      { productId: 'p-3', productName: "Camiseta Streetwear D'RAYO Graphic", quantity: 2, unitPrice: 49.00, costPrice: 20.00 },
      { productId: 'p-4', productName: "Pantalón Cargo D'RAYO Tactical", quantity: 1, unitPrice: 119.00, costPrice: 40.00 }
    ],
    subtotal: 217.00,
    shippingCost: 12.00,
    total: 229.00,
    paymentMethod: 'Transferencia Bancaria',
    status: 'Entregada',
    metaEventExported: false,
    notes: 'Transferencia BCP recibida.'
  },
  {
    id: 'VEN-2026-078',
    customerName: 'Sofía Benítez',
    customerPhone: '+51 978123456',
    customerEmail: 'sofiabenitez@gmail.com',
    city: 'Lima',
    date: '2026-05-28',
    time: '16:45',
    items: [
      { productId: 'p-6', productName: "Casaca Windbreaker D'RAYO Reflective", quantity: 1, unitPrice: 149.00, costPrice: 55.00 }
    ],
    subtotal: 149.00,
    shippingCost: 10.00,
    total: 159.00,
    paymentMethod: 'Yape',
    status: 'Entregada',
    metaEventExported: true,
    notes: 'Campana Meta Mayo. Yape directo.'
  },
  {
    id: 'VEN-2026-077',
    customerName: 'Diego Paredes',
    customerPhone: '+51 965412387',
    city: 'Cusco',
    date: '2026-05-20',
    time: '10:05',
    items: [
      { productId: 'p-1', productName: "Polera Oversize D'RAYO Heavyweight", quantity: 2, unitPrice: 89.00, costPrice: 35.00 }
    ],
    subtotal: 178.00,
    shippingCost: 18.00,
    total: 196.00,
    paymentMethod: 'Plin',
    status: 'Entregada',
    metaEventExported: true,
    notes: 'Envío Shalom Agencia.'
  },
  {
    id: 'VEN-2026-076',
    customerName: 'Lucía Morales',
    customerPhone: '+51 933221144',
    city: 'Chiclayo',
    date: '2026-04-28',
    time: '19:10',
    items: [
      { productId: 'p-4', productName: "Pantalón Cargo D'RAYO Tactical", quantity: 1, unitPrice: 119.00, costPrice: 40.00 },
      { productId: 'p-5', productName: "Gorra Snapback D'RAYO Classic", quantity: 1, unitPrice: 35.00, costPrice: 12.00 }
    ],
    subtotal: 154.00,
    shippingCost: 12.00,
    total: 166.00,
    paymentMethod: 'Yape',
    status: 'Entregada',
    metaEventExported: true,
    notes: 'Compra de campaña Meta Abril.'
  },
  {
    id: 'VEN-2026-075',
    customerName: 'Renzo Vargas',
    customerPhone: '+51 944556677',
    city: 'Piura',
    date: '2026-03-30',
    time: '15:50',
    items: [
      { productId: 'p-2', productName: "Zapatillas Urbanas D'RAYO Street", quantity: 1, unitPrice: 159.00, costPrice: 65.00 }
    ],
    subtotal: 159.00,
    shippingCost: 15.00,
    total: 174.00,
    paymentMethod: 'Transferencia Bancaria',
    status: 'Entregada',
    metaEventExported: true,
    notes: 'Campaña Meta Marzo.'
  }
];

export const INITIAL_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 't-1',
    title: 'Saludo & Catálogo',
    category: 'Bienvenida',
    text: '¡Hola! 🔥 Bienvenido a *D\'RAYO Streetwear*. ¿En qué prendas estás interesado hoy? Te envío nuestro catálogo actualizado con envíos a todo el Perú 📦⚡'
  },
  {
    id: 't-2',
    title: 'Datos de Pago (Yape / Plin)',
    category: 'Pago Yape/Plin',
    text: '¡Excelente elección! 🛍️ Puedes realizar tu pago mediante:\n\n📱 *Yape / Plin*: 987654321 (Titular: D\'RAYO Brand)\n💳 *BCP Transferencia*: 193-98765432-0-12\nCCI: 00219300987654320128\n\nPor favor envíame el comprobante para confirmar tu pedido y prepararlo de inmediato 🚀'
  },
  {
    id: 't-3',
    title: 'Confirmación de Pedido',
    category: 'Confirmación',
    text: '¡Pago recibido con éxito! 🎉 Tu pedido *{NRO_PEDIDO}* ha sido confirmado.\n\n📋 *Resumen de pedido*:\n{PRODUCTOS}\nTotal pagado: S/ {TOTAL}\n\nEn breve te enviaremos el número de seguimiento de tu envío 📦'
  },
  {
    id: 't-4',
    title: 'Notificación de Envío (Courier)',
    category: 'Envío',
    text: '📦 ¡Tu paquete va en camino! 🎉\n\nAgencia/Courier: {COURIER}\nCódigo de rastreo / Clave: *{RASTREO}*\n\n¡Gracias por preferir *D\'RAYO*! Déjanos tu foto etiquetándonos en Instagram cuando te llegue ⚡'
  }
];
