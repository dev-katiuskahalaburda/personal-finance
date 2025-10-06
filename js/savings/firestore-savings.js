// js/savings/firestore-savings.js
window.SavingsFirestore = {
    async getSavingsGoals(userId) {
        const snapshot = await window.firebaseFirestore
            .collection('users')
            .doc(userId)
            .collection('savingsGoals')
            .orderBy('createdAt', 'desc')
            .get();
            
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    },

    async addSavingsGoal(userId, goalData) {
        const goalWithMetadata = {
            ...goalData,
            currentAmount: 0,
            progress: 0,
            archived: false,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const docRef = await window.firebaseFirestore
            .collection('users')
            .doc(userId)
            .collection('savingsGoals')
            .add(goalWithMetadata);

        return docRef.id;
    },

    async updateSavingsGoal(userId, goalId, updates) {
        await window.firebaseFirestore
            .collection('users')
            .doc(userId)
            .collection('savingsGoals')
            .doc(goalId)
            .update({
                ...updates,
                updatedAt: new Date()
            });
    },

    async addSavingsContribution(userId, goalId, contributionData) {
        // Add to contributions subcollection
        const contributionRef = await window.firebaseFirestore
            .collection('users')
            .doc(userId)
            .collection('savingsGoals')
            .doc(goalId)
            .collection('contributions')
            .add({
                ...contributionData,
                createdAt: new Date()
            });

        // Update goal progress
        const goalDoc = await window.firebaseFirestore
            .collection('users')
            .doc(userId)
            .collection('savingsGoals')
            .doc(goalId)
            .get();

        const goal = goalDoc.data();
        const newAmount = (goal.currentAmount || 0) + contributionData.amount;
        const progress = (newAmount / goal.targetAmount) * 100;

        await this.updateSavingsGoal(userId, goalId, {
            currentAmount: newAmount,
            progress: progress
        });

        return contributionRef.id;
    },

    async archiveSavingsGoal(userId, goalId) {
        await this.updateSavingsGoal(userId, goalId, {
            archived: true
        });
    },

    async deleteSavingsGoal(userId, goalId) {
        // First delete all contributions
        const contributionsSnapshot = await window.firebaseFirestore
            .collection('users')
            .doc(userId)
            .collection('savingsGoals')
            .doc(goalId)
            .collection('contributions')
            .get();

        const deletePromises = contributionsSnapshot.docs.map(doc => doc.ref.delete());
        await Promise.all(deletePromises);

        // Then delete the goal
        await window.firebaseFirestore
            .collection('users')
            .doc(userId)
            .collection('savingsGoals')
            .doc(goalId)
            .delete();
    },

    async getGoalContributions(userId, goalId, limit = 10) {
        const snapshot = await window.firebaseFirestore
            .collection('users')
            .doc(userId)
            .collection('savingsGoals')
            .doc(goalId)
            .collection('contributions')
            .orderBy('date', 'desc')
            .limit(limit)
            .get();

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }
};

// Attach to global window object for component access
window.getSavingsGoals = window.SavingsFirestore.getSavingsGoals.bind(window.SavingsFirestore);
window.addSavingsGoal = window.SavingsFirestore.addSavingsGoal.bind(window.SavingsFirestore);
window.updateSavingsGoal = window.SavingsFirestore.updateSavingsGoal.bind(window.SavingsFirestore);
window.addSavingsContribution = window.SavingsFirestore.addSavingsContribution.bind(window.SavingsFirestore);
window.archiveSavingsGoal = window.SavingsFirestore.archiveSavingsGoal.bind(window.SavingsFirestore);
window.deleteSavingsGoal = window.SavingsFirestore.deleteSavingsGoal.bind(window.SavingsFirestore);