package content;

public class Link<T extends Content<?>, R extends Content<?>> {

	private T first;
	private R second;

	private Link(T t, R r) {
		this.first = t;
		this.second = r;
	}
	
	public T first() {
		return this.first;
	}

	public R second() {
		return this.second;
	}


	public static <T extends Content<?>, R extends Content<?>> Link<T, R> getNewLink(T t, R r) {
		return new Link<T, R>(t, r);
	}

}
