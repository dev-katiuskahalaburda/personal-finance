// vue-app.js - Main app setup & routing
(function() {
    const { createApp } = Vue;

    // Import components (they'll be loaded via script tags)
    const Dashboard = window.DashboardComponent;
    const AddTransaction = window.AddTransactionComponent;
    const SummaryDashboard = window.SummaryDashboardComponent;
    const DetailedTransactions = window.DetailedTransactionsComponent;
    // Future components will be added here

    const routes = [
        { path: '/', component: Dashboard },
        { path: '/add-transaction', component: AddTransaction },
        { path: '/summary', component: SummaryDashboard },
        { path: '/transactions', component: DetailedTransactions }
        // Future routes will be added here
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