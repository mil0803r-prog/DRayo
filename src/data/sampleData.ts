import { Product, Sale, WhatsAppTemplate, DailySaleRecord, PricingCalculationRecord, IndirectCost } from '../types';

export const INITIAL_DAILY_RECORDS: DailySaleRecord[] = [];

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_SALES: Sale[] = [];

export const INITIAL_PRICING_RECORDS: PricingCalculationRecord[] = [];

export const INITIAL_INDIRECT_COSTS: IndirectCost[] = [];

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
