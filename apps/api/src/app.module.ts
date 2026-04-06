import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TenantsModule } from './modules/tenants/tenants.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CustomersModule } from './modules/customers/customers.module';
import { InsuranceModule } from './modules/insurance/insurance.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { EstimatesModule } from './modules/estimates/estimates.module';
import { ServiceOrdersModule } from './modules/service-orders/service-orders.module';
import { FinancialModule } from './modules/financial/financial.module';
import { DatabaseModule } from './config/database.module';
import { RedisModule } from './config/redis.module';
import { TenantMiddleware } from './common/interceptors/tenant-context.interceptor';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    DatabaseModule,
    RedisModule,
    TenantsModule,
    AuthModule,
    UsersModule,
    CustomersModule,
    InsuranceModule,
    VehiclesModule,
    EstimatesModule,
    ServiceOrdersModule,
    FinancialModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
