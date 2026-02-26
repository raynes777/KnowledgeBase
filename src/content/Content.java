package content;

import java.util.Collection;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import content.version.Version;
import content.visitor.ContentVisitor;

public abstract class Content<T> {
	


	private  T content;
	private Author author;
	private Optional<Version> version;
	private Collection<Link<?,?>> links;
	
	protected void setContent(T content) {
		this.content = content;
	}

	protected void setAuthor(Author author) {
		this.author = author;
	}

	protected void setVersion(Optional<Version> version) {
		this.version = version;
	}

	protected void setLinks(Collection<Link<?, ?>> links) {
		this.links = links;
	}

	public Author author() {
		return this.author;
	};
	
	public  Version version() {
		if (!version.isPresent()){
			this.version = Optional.of(Version.getNewVersion(this));
		}
		
		return this.version.get();
	}

	public  Collection<Link<?, ?>> links(){
		return this.links;
	}

	public  T show() {
		return this.content;
	}

	/* Return a new Link<T,R> Object, add it to c.links and this.links */
	public abstract <R> void link(Content<R> c);

	void addLink(Link<?, ?> l) {
		this.links = Stream.concat(links.stream(), Stream.of(l))
				.distinct()
				.collect(Collectors.toList());
	}
	
	
	
	public abstract <W> W accept(ContentVisitor<W> visitor);
	
	public static abstract class builder<P extends Content<?>> {
		/* Returns a new Content<T> Object> */
		public abstract P build();
		/* Return a new version of given Content<T> Object */
		public abstract P buildFrom(P content);
	}
	
		
}
