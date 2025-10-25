/**
 * Represents a subscription to changes in a flow.
 *
 * A FlowSubscription is returned when subscribing to a Flow and provides
 * a mechanism to unsubscribe from further notifications.
 *
 * @example
 * ```typescript
 * const flow: Flow<number> = createFlow(42);
 *
 * // Subscribe to changes
 * const subscription = flow.subscribe(() => {
 *   console.log('Flow changed:', flow.getSnapshot());
 * });
 *
 * // Later, clean up the subscription
 * subscription.unsubscribe();
 * ```
 *
 * @example
 * ```typescript
 * // Using subscription in a component lifecycle
 * class Component {
 *   private subscription?: FlowSubscription;
 *
 *   mount() {
 *     this.subscription = someFlow.subscribe(() => {
 *       this.render();
 *     });
 *   }
 *
 *   unmount() {
 *     this.subscription?.unsubscribe();
 *   }
 * }
 * ```
 */
export interface FlowSubscription {
    /**
     * Unsubscribes from the flow, stopping all future notifications.
     *
     * After calling this method, the subscription callback will no longer
     * be invoked when the flow changes. This is important for preventing
     * memory leaks and unwanted side effects.
     *
     * @example
     * ```typescript
     * const subscription = flow.subscribe(() => {
     *   console.log('Flow updated');
     * });
     *
     * // Stop receiving updates
     * subscription.unsubscribe();
     *
     * // The callback above will no longer be called
     * flow.emit(newValue);
     * ```
     */
    unsubscribe: () => void;
}
