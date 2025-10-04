
// vue-app.js - Main app setup & routing
(function() {
    const { createApp } = Vue;

    const Dashboard = window.DashboardComponent;
    const AddTransaction = window.AddTransactionComponent;
    const SummaryDashboard = window.DetailedTransactionsComponent;
    const SavingsDashboard = window.SavingsDashboardComponent; // Add this line

    const routes = [
        { path: '/', component: Dashboard },
        { path: '/add-transaction', component: AddTransaction },
        { path: '/summary', component: SummaryDashboard },
        { path: '/savings', component: SavingsDashboard } // Add this route
    ];

    const router = VueRouter.createRouter({
        history: VueRouter.createWebHashHistory(),
        routes
    });

    const app = createApp({
        template: `<router-view></router-view>`
    });

    app.use(router);
    app.mount('#vue-app');
})();
