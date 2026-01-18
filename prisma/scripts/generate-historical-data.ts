import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuration
const DAYS_OF_HISTORY = 90;
const MERCHANTS = [
  { id: 'carrefour-ro', name: 'Carrefour Romania', baseTransactions: 150, avgBasket: 85 },
  { id: 'lidl-ro', name: 'Lidl Romania', baseTransactions: 200, avgBasket: 65 },
];

const CATEGORIES = [
  { name: 'Groceries', weight: 0.45, avgAmount: 75 },
  { name: 'Fresh Produce', weight: 0.20, avgAmount: 45 },
  { name: 'Beverages', weight: 0.15, avgAmount: 35 },
  { name: 'Household', weight: 0.10, avgAmount: 55 },
  { name: 'Personal Care', weight: 0.10, avgAmount: 40 },
];

// Utility functions
function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomBetween(min, max + 1));
}

function pickCategory(): { name: string; avgAmount: number } {
  const rand = Math.random();
  let cumulative = 0;
  for (const cat of CATEGORIES) {
    cumulative += cat.weight;
    if (rand <= cumulative) return { name: cat.name, avgAmount: cat.avgAmount };
  }
  return CATEGORIES[0];
}

function getDayMultiplier(date: Date): number {
  const day = date.getDay();
  // Weekend boost
  if (day === 0) return 1.3; // Sunday
  if (day === 6) return 1.5; // Saturday
  // Friday slight boost
  if (day === 5) return 1.15;
  // Monday-Thursday normal
  return 1.0;
}

function getSeasonalMultiplier(date: Date): number {
  const month = date.getMonth();
  // Holiday season boost
  if (month === 11) return 1.4; // December
  if (month === 10) return 1.1; // November
  // Summer slight dip
  if (month >= 6 && month <= 7) return 0.9;
  return 1.0;
}

function getTrendMultiplier(daysAgo: number, totalDays: number): number {
  // Simulate 5% growth over the period
  const progress = (totalDays - daysAgo) / totalDays;
  return 0.95 + (progress * 0.10);
}

async function generateHistoricalData() {
  console.log('🚀 Starting historical data generation...');
  console.log(`📅 Generating ${DAYS_OF_HISTORY} days of data for ${MERCHANTS.length} merchants`);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let totalTransactions = 0;
  let totalRevenue = 0;

  for (const merchant of MERCHANTS) {
    console.log(`\n📊 Processing ${merchant.name}...`);
    
    // First ensure merchant exists
    await prisma.merchants.upsert({
      where: { id: merchant.id },
      update: { name: merchant.name },
      create: { id: merchant.id, name: merchant.name },
    });

    const transactions: any[] = [];
    const dailyMetrics: Map<string, any> = new Map();

    for (let daysAgo = DAYS_OF_HISTORY; daysAgo >= 0; daysAgo--) {
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);
      const dateStr = date.toISOString().split('T')[0];

      // Calculate multipliers
      const dayMult = getDayMultiplier(date);
      const seasonMult = getSeasonalMultiplier(date);
      const trendMult = getTrendMultiplier(daysAgo, DAYS_OF_HISTORY);
      
      // Add some random noise (±15%)
      const noiseMult = randomBetween(0.85, 1.15);
      
      const finalMult = dayMult * seasonMult * trendMult * noiseMult;
      const dailyTransactionCount = Math.round(merchant.baseTransactions * finalMult);

      let dailyRevenue = 0;
      let dailyCashback = 0;
      const dailyCustomers = new Set<string>();

      // Generate individual transactions
      for (let i = 0; i < dailyTransactionCount; i++) {
        const category = pickCategory();
        const amount = Math.round(category.avgAmount * randomBetween(0.5, 2.0) * 100) / 100;
        const cashbackRate = merchant.id === 'carrefour-ro' ? 0.05 : 0.03;
        const cashback = Math.round(amount * cashbackRate * 100) / 100;
        
        // Generate customer ID (some repeat customers)
        const customerId = `cust_${randomInt(1, Math.round(dailyTransactionCount * 0.7))}`;
        dailyCustomers.add(customerId);

        // Random time during business hours (8am - 10pm)
        const hour = randomInt(8, 22);
        const minute = randomInt(0, 59);
        const transactionDate = new Date(date);
        transactionDate.setHours(hour, minute, randomInt(0, 59));

        transactions.push({
          merchant_id: merchant.id,
          transaction_date: transactionDate,
          amount: amount,
          customer_id: customerId,
          cashback_amount: cashback,
          category: category.name,
        });

        dailyRevenue += amount;
        dailyCashback += cashback;
      }

      // Store daily metrics
      dailyMetrics.set(dateStr, {
        merchant_id: merchant.id,
        date: date,
        transactions_count: dailyTransactionCount,
        revenue: Math.round(dailyRevenue * 100) / 100,
        unique_customers: dailyCustomers.size,
        cashback_paid: Math.round(dailyCashback * 100) / 100,
      });

      totalTransactions += dailyTransactionCount;
      totalRevenue += dailyRevenue;
    }

    // Batch insert transactions
    console.log(`  💾 Inserting ${transactions.length} transactions...`);
    
    // Delete existing data for this merchant
    await prisma.transactions.deleteMany({ where: { merchant_id: merchant.id } });
    await prisma.daily_metrics.deleteMany({ where: { merchant_id: merchant.id } });

    // Insert in batches of 1000
    const batchSize = 1000;
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      await prisma.transactions.createMany({ data: batch });
      process.stdout.write(`\r  Progress: ${Math.min(i + batchSize, transactions.length)}/${transactions.length}`);
    }
    console.log('');

    // Insert daily metrics
    console.log(`  📈 Inserting ${dailyMetrics.size} daily metric records...`);
    await prisma.daily_metrics.createMany({ 
      data: Array.from(dailyMetrics.values()) 
    });

    console.log(`  ✅ ${merchant.name} complete!`);
  }

  console.log('\n========================================');
  console.log('🎉 Historical data generation complete!');
  console.log(`📊 Total transactions: ${totalTransactions.toLocaleString()}`);
  console.log(`💰 Total revenue: ${totalRevenue.toLocaleString()} RON`);
  console.log('========================================');
}

generateHistoricalData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
