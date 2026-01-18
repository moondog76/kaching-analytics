import { PrismaClient } from '../../lib/generated/prisma';

const prisma = new PrismaClient();

async function populateDailyMetrics() {
  console.log('🚀 Starting daily metrics population...');
  
  // Get all merchants
  const merchants = await prisma.merchants.findMany();
  console.log(`Found ${merchants.length} merchants`);
  
  // Generate 90 days of history
  const DAYS = 90;
  const today = new Date();
  
  for (const merchant of merchants) {
    console.log(`\n📊 Processing ${merchant.name}...`);
    const dailyMetrics: any[] = [];
    
    // Get transaction stats for this merchant
    const txStats = await prisma.transactions.aggregate({
      where: { merchant_id: merchant.id },
      _count: true,
      _sum: { amount: true, cashback_amount: true },
      _avg: { amount: true }
    });
    
    const baseTransactions = Math.floor((txStats._count || 100) / 30); // daily avg
    const baseRevenue = Number(txStats._avg?.amount || 100);
    
    for (let i = DAYS; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      // Add realistic variance
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const weekendMultiplier = isWeekend ? 1.3 : 1.0;
      
      // Seasonal trend (slight growth over time)
      const trendMultiplier = 1 + (DAYS - i) * 0.002;
      
      // Random daily variance
      const randomVariance = 0.8 + Math.random() * 0.4;
      
      const transactions = Math.floor(baseTransactions * weekendMultiplier * trendMultiplier * randomVariance);
      const avgTransaction = baseRevenue * (0.9 + Math.random() * 0.2);
      const revenue = transactions * avgTransaction;
      const uniqueCustomers = Math.floor(transactions * (0.7 + Math.random() * 0.2));
      const cashbackPaid = revenue * 0.03; // 3% cashback
      
      dailyMetrics.push({
        merchant_id: merchant.id,
        date: date,
        transactions_count: transactions,
        revenue: revenue,
        unique_customers: uniqueCustomers,
        cashback_paid: cashbackPaid
      });
    }
    
    // Delete existing metrics for this merchant
    await prisma.daily_metrics.deleteMany({
      where: { merchant_id: merchant.id }
    });
    
    // Insert new metrics
    await prisma.daily_metrics.createMany({
      data: dailyMetrics
    });
    
    console.log(`✅ Created ${dailyMetrics.length} daily metrics for ${merchant.name}`);
  }
  
  console.log('\n🎉 Daily metrics population complete!');
}

populateDailyMetrics()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
