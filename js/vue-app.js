// vue-app.js - Main app setup & routing
(function() {
    const { createApp } = Vue;

    const Dashboard = window.DashboardComponent;
    const AddTransaction = window.AddTransactionComponent;
    const SummaryDashboard = window.DetailedTransactionsComponent; // Now using DetailedTransactions as SummaryDashboard

    const routes = [
        { path: '/', component: Dashboard },
        { path: '/add-transaction', component: AddTransaction },
        { path: '/summary', component: SummaryDashboard } // This now shows the detailed transactions view
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